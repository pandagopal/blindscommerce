import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface ShippingRateRequest {
  address_id?: number;
  address?: {
    country: string;
    state_province?: string;
    postal_code?: string;
    city?: string;
  };
  items: Array<{
    weight_lbs?: number;
    length_inches?: number;
    width_inches?: number;
    height_inches?: number;
    quantity: number;
    price: number;
  }>;
  total_value?: number;
}

interface ShippingZoneRow extends RowDataPacket {
  zone_id: number;
  zone_name: string;
  zone_code: string;
  countries: string;
  states_provinces: string | null;
  postal_code_patterns: string | null;
  priority: number;
}

interface ShippingRateRow extends RowDataPacket {
  rate_id: number;
  zone_id: number;
  service_type: string;
  service_name: string;
  carrier: string;
  base_rate: number;
  per_pound_rate: number;
  per_item_rate: number;
  minimum_rate: number;
  maximum_rate: number | null;
  free_shipping_threshold: number | null;
  weight_threshold_lbs: number | null;
  estimated_days_min: number;
  estimated_days_max: number;
  business_days_only: boolean;
  requires_signature: boolean;
  requires_adult_signature: boolean;
  includes_insurance: boolean;
  max_insurance_value: number | null;
}

// POST /api/shipping/rates - Calculate shipping rates for address and items
export async function POST(req: NextRequest) {
  try {
    const body: ShippingRateRequest = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required for shipping calculation' },
        { status: 400 }
      );
    }

    let shippingAddress;

    if (body.address_id) {
      // Fetch address from database
      const pool = await getPool();
      const [addresses] = await pool.execute<RowDataPacket[]>(
        'SELECT country, state_province, postal_code, city FROM user_shipping_addresses WHERE address_id = ? AND is_active = TRUE',
        [body.address_id]
      );

      if (addresses.length === 0) {
        return NextResponse.json(
          { error: 'Address not found' },
          { status: 404 }
        );
      }

      shippingAddress = addresses[0];
    } else if (body.address) {
      shippingAddress = body.address;
    } else {
      return NextResponse.json(
        { error: 'Either address_id or address is required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const totalWeight = body.items.reduce((sum, item) => sum + ((item.weight_lbs || 1) * item.quantity), 0);
    const totalValue = body.total_value || body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = body.items.reduce((sum, item) => sum + item.quantity, 0);

    // Find matching shipping zone
    const pool = await getPool();
    const [zones] = await pool.execute<ShippingZoneRow[]>(
      'SELECT * FROM shipping_zones WHERE is_active = TRUE ORDER BY priority DESC'
    );

    let matchingZone: ShippingZoneRow | null = null;

    for (const zone of zones) {
      const countries = JSON.parse(zone.countries);
      
      // Check if country matches
      if (countries.includes('*') || countries.includes(shippingAddress.country)) {
        // Check state/province if specified
        if (zone.states_provinces) {
          const statesProvinces = JSON.parse(zone.states_provinces);
          if (shippingAddress.state_province && !statesProvinces.includes(shippingAddress.state_province)) {
            continue;
          }
        }

        // Check postal code patterns if specified
        if (zone.postal_code_patterns) {
          const patterns = JSON.parse(zone.postal_code_patterns);
          let postalMatch = false;
          
          for (const pattern of patterns) {
            const regex = new RegExp(pattern);
            if (regex.test(shippingAddress.postal_code || '')) {
              postalMatch = true;
              break;
            }
          }
          
          if (!postalMatch) {
            continue;
          }
        }

        // Zone matches
        matchingZone = zone;
        break;
      }
    }

    if (!matchingZone) {
      return NextResponse.json(
        { error: 'No shipping available to this location' },
        { status: 400 }
      );
    }

    // Get shipping rates for the zone
    const [rates] = await pool.execute<ShippingRateRow[]>(
      `SELECT * FROM shipping_rates 
       WHERE zone_id = ? AND is_active = TRUE 
       AND (effective_from IS NULL OR effective_from <= CURDATE())
       AND (effective_until IS NULL OR effective_until >= CURDATE())
       ORDER BY estimated_days_min ASC, base_rate ASC`,
      [matchingZone.zone_id]
    );

    if (rates.length === 0) {
      return NextResponse.json(
        { error: 'No shipping rates available for this location' },
        { status: 400 }
      );
    }

    // Calculate costs for each rate
    const shippingOptions = rates.map(rate => {
      let cost = rate.base_rate;

      // Add per-pound charges
      if (rate.per_pound_rate > 0) {
        cost += totalWeight * rate.per_pound_rate;
      }

      // Add per-item charges
      if (rate.per_item_rate > 0) {
        cost += totalItems * rate.per_item_rate;
      }

      // Apply minimum rate
      if (cost < rate.minimum_rate) {
        cost = rate.minimum_rate;
      }

      // Apply maximum rate if specified
      if (rate.maximum_rate && cost > rate.maximum_rate) {
        cost = rate.maximum_rate;
      }

      // Check for free shipping
      let isFree = false;
      if (rate.free_shipping_threshold && totalValue >= rate.free_shipping_threshold) {
        cost = 0;
        isFree = true;
      }

      // Calculate estimated delivery date range
      const today = new Date();
      let estimatedDeliveryMin = new Date(today);
      let estimatedDeliveryMax = new Date(today);

      if (rate.business_days_only) {
        // Add business days only
        let businessDaysAdded = 0;
        let currentDate = new Date(today);
        
        while (businessDaysAdded < rate.estimated_days_min) {
          currentDate.setDate(currentDate.getDate() + 1);
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
            businessDaysAdded++;
          }
        }
        estimatedDeliveryMin = new Date(currentDate);

        businessDaysAdded = 0;
        currentDate = new Date(today);
        while (businessDaysAdded < rate.estimated_days_max) {
          currentDate.setDate(currentDate.getDate() + 1);
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            businessDaysAdded++;
          }
        }
        estimatedDeliveryMax = new Date(currentDate);
      } else {
        // Add calendar days
        estimatedDeliveryMin.setDate(today.getDate() + rate.estimated_days_min);
        estimatedDeliveryMax.setDate(today.getDate() + rate.estimated_days_max);
      }

      return {
        rateId: rate.rate_id,
        serviceType: rate.service_type,
        serviceName: rate.service_name,
        carrier: rate.carrier,
        cost: parseFloat(cost.toFixed(2)),
        isFree,
        estimatedDelivery: {
          min: estimatedDeliveryMin.toISOString().split('T')[0],
          max: estimatedDeliveryMax.toISOString().split('T')[0],
          businessDaysOnly: rate.business_days_only,
          minDays: rate.estimated_days_min,
          maxDays: rate.estimated_days_max
        },
        features: {
          requiresSignature: rate.requires_signature,
          requiresAdultSignature: rate.requires_adult_signature,
          includesInsurance: rate.includes_insurance,
          maxInsuranceValue: rate.max_insurance_value
        }
      };
    });

    return NextResponse.json({
      success: true,
      shippingZone: {
        id: matchingZone.zone_id,
        name: matchingZone.zone_name,
        code: matchingZone.zone_code
      },
      packageInfo: {
        totalWeight,
        totalValue,
        totalItems
      },
      shippingOptions,
      address: {
        country: shippingAddress.country,
        stateProvince: shippingAddress.state_province,
        postalCode: shippingAddress.postal_code,
        city: shippingAddress.city
      }
    });

  } catch (error) {
    console.error('Error calculating shipping rates:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping rates' },
      { status: 500 }
    );
  }
}