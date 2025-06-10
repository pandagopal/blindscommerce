import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface DeliverySlotRow extends RowDataPacket {
  slot_id: number;
  slot_name: string;
  slot_code: string;
  start_time: string;
  end_time: string;
  available_days: string;
  blackout_dates: string | null;
  max_deliveries_per_day: number;
  additional_fee: number;
  min_lead_days: number;
  max_advance_days: number;
  requires_signature: boolean;
  allows_specific_time_request: boolean;
  priority_order: number;
}

interface CapacityRow extends RowDataPacket {
  delivery_date: string;
  time_slot_id: number;
  available_capacity: number;
  is_blocked: boolean;
  block_reason: string | null;
}

interface BlackoutDateRow extends RowDataPacket {
  blackout_date: string;
  blackout_name: string;
  applies_to_all_slots: boolean;
  specific_slot_ids: string | null;
  notification_message: string | null;
}

// GET /api/delivery/slots - Get available delivery slots for a date range
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const postalCode = searchParams.get('postal_code');
    const country = searchParams.get('country') || 'United States';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Validate date format and range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start < today) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Limit date range to prevent excessive queries
    const maxDays = 60;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${maxDays} days` },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get active delivery slots
    const [slots] = await pool.execute<DeliverySlotRow[]>(
      `SELECT slot_id, slot_name, slot_code, start_time, end_time, 
              available_days, blackout_dates, max_deliveries_per_day,
              additional_fee, min_lead_days, max_advance_days,
              requires_signature, allows_specific_time_request, priority_order
       FROM delivery_time_slots 
       WHERE is_active = TRUE 
       ORDER BY priority_order ASC, start_time ASC`
    );

    // Get blackout dates for the range
    const [blackoutDates] = await pool.execute<BlackoutDateRow[]>(
      `SELECT blackout_date, blackout_name, applies_to_all_slots, 
              specific_slot_ids, notification_message
       FROM delivery_blackout_dates 
       WHERE blackout_date BETWEEN ? AND ?
       ORDER BY blackout_date`,
      [startDate, endDate]
    );

    // Get capacity for the date range
    const [capacityData] = await pool.execute<CapacityRow[]>(
      `SELECT DATE_FORMAT(delivery_date, '%Y-%m-%d') as delivery_date, 
              time_slot_id, available_capacity, is_blocked, block_reason
       FROM delivery_capacity 
       WHERE delivery_date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // Create capacity lookup map
    const capacityMap = new Map<string, any>();
    capacityData.forEach(cap => {
      const key = `${cap.delivery_date}-${cap.time_slot_id}`;
      capacityMap.set(key, {
        availableCapacity: cap.available_capacity,
        isBlocked: cap.is_blocked,
        blockReason: cap.block_reason
      });
    });

    // Create blackout dates set
    const blackoutMap = new Map<string, BlackoutDateRow[]>();
    blackoutDates.forEach(blackout => {
      const dateStr = blackout.blackout_date;
      if (!blackoutMap.has(dateStr)) {
        blackoutMap.set(dateStr, []);
      }
      blackoutMap.get(dateStr)!.push(blackout);
    });

    // Generate available slots for each date
    const availableSlots: any[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const daysFromToday = Math.ceil((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check if date has blackouts
      const dateBlackouts = blackoutMap.get(dateStr) || [];
      const isFullyBlackedOut = dateBlackouts.some(b => b.applies_to_all_slots);

      for (const slot of slots) {
        const availableDays = JSON.parse(slot.available_days);
        
        // Check if slot is available on this day of week
        if (!availableDays.includes(dayOfWeek)) {
          continue;
        }

        // Check minimum lead time
        if (daysFromToday < slot.min_lead_days) {
          continue;
        }

        // Check maximum advance days
        if (daysFromToday > slot.max_advance_days) {
          continue;
        }

        // Check slot-specific blackouts
        const slotBlackouts = slot.blackout_dates ? JSON.parse(slot.blackout_dates) : [];
        if (slotBlackouts.includes(dateStr)) {
          continue;
        }

        // Check general blackouts
        if (isFullyBlackedOut) {
          continue;
        }

        const slotSpecificBlackout = dateBlackouts.find(b => {
          if (!b.applies_to_all_slots && b.specific_slot_ids) {
            const specificSlots = JSON.parse(b.specific_slot_ids);
            return specificSlots.includes(slot.slot_id);
          }
          return false;
        });

        if (slotSpecificBlackout) {
          continue;
        }

        // Get capacity information
        const capacityKey = `${dateStr}-${slot.slot_id}`;
        const capacity = capacityMap.get(capacityKey);
        
        const availableCapacity = capacity?.availableCapacity ?? slot.max_deliveries_per_day;
        const isBlocked = capacity?.isBlocked ?? false;
        const blockReason = capacity?.blockReason ?? null;

        if (isBlocked) {
          continue;
        }

        availableSlots.push({
          date: dateStr,
          slotId: slot.slot_id,
          slotName: slot.slot_name,
          slotCode: slot.slot_code,
          timeWindow: {
            start: slot.start_time,
            end: slot.end_time
          },
          availableCapacity,
          totalCapacity: slot.max_deliveries_per_day,
          additionalFee: parseFloat(slot.additional_fee.toString()),
          requiresSignature: slot.requires_signature,
          allowsSpecificTimeRequest: slot.allows_specific_time_request,
          isAvailable: availableCapacity > 0,
          dayOfWeek,
          daysFromToday
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group by date for easier consumption
    const slotsByDate = availableSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = {
          date: slot.date,
          dayOfWeek: slot.dayOfWeek,
          daysFromToday: slot.daysFromToday,
          slots: [],
          blackouts: blackoutMap.get(slot.date)?.map(b => ({
            name: b.blackout_name,
            message: b.notification_message
          })) || []
        };
      }
      acc[slot.date].slots.push(slot);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      dateRange: {
        start: startDate,
        end: endDate
      },
      deliverySlots: Object.values(slotsByDate),
      totalDates: Object.keys(slotsByDate).length,
      totalAvailableSlots: availableSlots.filter(s => s.isAvailable).length
    });

  } catch (error) {
    console.error('Error fetching delivery slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery slots' },
      { status: 500 }
    );
  }
}