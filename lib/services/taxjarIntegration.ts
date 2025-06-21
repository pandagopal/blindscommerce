import { getSetting } from '@/lib/settings';
import { TaxCalculation } from './taxCalculation';

interface TaxJarRateResponse {
  rate: {
    zip: string;
    state: string;
    state_rate: string;
    county: string;
    county_rate: string;
    city: string;
    city_rate: string;
    combined_district_rate: string;
    combined_rate: string;
    freight_taxable: boolean;
  };
}

interface TaxJarTaxResponse {
  tax: {
    order_total_amount: number;
    shipping: number;
    taxable_amount: number;
    amount_to_collect: number;
    rate: number;
    has_nexus: boolean;
    freight_taxable: boolean;
    tax_source: string;
    exemption_type?: string;
    jurisdictions: {
      country?: string;
      state?: string;
      county?: string;
      city?: string;
    };
    breakdown?: {
      taxable_amount: number;
      tax_collectable: number;
      combined_tax_rate: number;
      state_taxable_amount: number;
      state_tax_rate: number;
      state_tax_collectable: number;
      county_taxable_amount: number;
      county_tax_rate: number;
      county_tax_collectable: number;
      city_taxable_amount: number;
      city_tax_rate: number;
      city_tax_collectable: number;
      special_district_taxable_amount: number;
      special_tax_rate: number;
      special_district_tax_collectable: number;
    };
  };
}

/**
 * Get tax rate for a ZIP code using TaxJar API
 */
export async function getTaxJarRateByZip(zipCode: string): Promise<TaxJarRateResponse | null> {
  try {
    const apiKey = await getSetting('integrations', 'taxjar_api_key');
    const environment = await getSetting('integrations', 'taxjar_environment');
    const useTaxJar = await getSetting('integrations', 'use_taxjar_api');

    if (!useTaxJar || !apiKey) {
      return null;
    }

    const baseUrl = environment === 'production' 
      ? 'https://api.taxjar.com' 
      : 'https://api.sandbox.taxjar.com';

    const response = await fetch(`${baseUrl}/v2/rates/${zipCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('TaxJar API error:', response.status, response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching TaxJar rate:', error);
    return null;
  }
}

/**
 * Calculate tax using TaxJar API
 */
export async function calculateTaxWithTaxJar(
  subtotal: number,
  shipping: number,
  zipCode: string,
  items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    product_tax_code?: string;
  }>
): Promise<TaxCalculation | null> {
  try {
    const apiKey = await getSetting('integrations', 'taxjar_api_key');
    const environment = await getSetting('integrations', 'taxjar_environment');
    const useTaxJar = await getSetting('integrations', 'use_taxjar_api');

    if (!useTaxJar || !apiKey) {
      return null;
    }

    const baseUrl = environment === 'production' 
      ? 'https://api.taxjar.com' 
      : 'https://api.sandbox.taxjar.com';

    const taxRequest = {
      from_country: 'US',
      from_zip: '78701', // Your business location
      from_state: 'TX',
      to_country: 'US',
      to_zip: zipCode,
      amount: subtotal,
      shipping: shipping,
      ...(items && {
        line_items: items.map((item, index) => ({
          id: item.id || index.toString(),
          quantity: item.quantity,
          product_tax_code: item.product_tax_code || '20010', // General merchandise
          unit_price: item.unit_price,
          discount: 0,
        }))
      })
    };

    const response = await fetch(`${baseUrl}/v2/taxes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taxRequest),
    });

    if (!response.ok) {
      console.error('TaxJar API error:', response.status, response.statusText);
      return null;
    }

    const taxResponse: TaxJarTaxResponse = await response.json();
    const tax = taxResponse.tax;

    // Convert TaxJar response to our TaxCalculation format
    return {
      subtotal,
      tax_rate: tax.rate * 100, // Convert to percentage
      tax_amount: tax.amount_to_collect,
      total_amount: subtotal + shipping + tax.amount_to_collect,
      tax_breakdown: {
        state_tax: tax.breakdown?.state_tax_collectable || 0,
        county_tax: tax.breakdown?.county_tax_collectable || 0,
        city_tax: tax.breakdown?.city_tax_collectable || 0,
        special_district_tax: tax.breakdown?.special_district_tax_collectable || 0,
      },
      tax_jurisdiction: `${tax.jurisdictions.city || ''}, ${tax.jurisdictions.state || ''} (TaxJar)`.trim(),
      zip_code: zipCode
    };

  } catch (error) {
    console.error('Error calculating tax with TaxJar:', error);
    return null;
  }
}

/**
 * Test TaxJar API connection
 */
export async function testTaxJarConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const apiKey = await getSetting('integrations', 'taxjar_api_key');
    const environment = await getSetting('integrations', 'taxjar_environment');

    if (!apiKey) {
      return { success: false, message: 'TaxJar API key is required' };
    }

    const baseUrl = environment === 'production' 
      ? 'https://api.taxjar.com' 
      : 'https://api.sandbox.taxjar.com';

    // Test with a simple rate lookup for Austin, TX
    const response = await fetch(`${baseUrl}/v2/rates/78701`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { 
        success: false, 
        message: `TaxJar API error: ${response.status} ${response.statusText}` 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Connection successful! Rate for Austin, TX: ${data.rate.combined_rate}%` 
    };

  } catch (error) {
    return { 
      success: false, 
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}