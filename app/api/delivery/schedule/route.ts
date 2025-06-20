import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ScheduleDeliveryRequest {
  order_id: number;
  delivery_date: string;
  time_slot_id: number;
  specific_time_requested?: string;
  customer_notes?: string;
  alternative_recipient?: string;
  alternative_phone?: string;
  delivery_location?: 'front_door' | 'back_door' | 'garage' | 'reception' | 'mailroom' | 'other';
  location_details?: string;
  access_instructions?: string;
  notification_preferences?: {
    sms?: boolean;
    email?: boolean;
    phone?: boolean;
  };
  notify_on_day_before?: boolean;
  notify_on_delivery_day?: boolean;
  notify_one_hour_before?: boolean;
}

interface OrderRow extends RowDataPacket {
  order_id: number;
  customer_id: number;
  status: string;
}

interface ExistingScheduleRow extends RowDataPacket {
  schedule_id: number;
  delivery_date: string;
  time_slot_id: number;
  status: string;
}

// POST /api/delivery/schedule - Schedule a delivery for an order
export async function POST(req: NextRequest) {
  let connection;
  
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: ScheduleDeliveryRequest = await req.json();

    // Validate required fields
    if (!body.order_id || !body.delivery_date || !body.time_slot_id) {
      return NextResponse.json(
        { error: 'order_id, delivery_date, and time_slot_id are required' },
        { status: 400 }
      );
    }

    // Validate delivery date
    const deliveryDate = new Date(body.delivery_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(deliveryDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid delivery date format' },
        { status: 400 }
      );
    }

    if (deliveryDate < today) {
      return NextResponse.json(
        { error: 'Delivery date cannot be in the past' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    connection = await pool.getConnection();

    // Verify order belongs to user and is eligible for scheduling
    const [orderRows] = await connection.execute<OrderRow[]>(
      `SELECT order_id, customer_id, status 
       FROM orders 
       WHERE order_id = ? AND (customer_id = ? OR customer_id IS NULL)`,
      [body.order_id, user.userId]
    );

    if (orderRows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderRows[0];

    // Check if order is in valid status for scheduling
    const validStatuses = ['pending', 'confirmed', 'processing'];
    if (!validStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot schedule delivery for order with status: ${order.status}` },
        { status: 400 }
      );
    }

    // Check if delivery is already scheduled
    const [existingSchedule] = await connection.execute<ExistingScheduleRow[]>(
      'SELECT schedule_id, delivery_date, time_slot_id, status FROM order_delivery_schedules WHERE order_id = ?',
      [body.order_id]
    );

    const isReschedule = existingSchedule.length > 0;
    let previousScheduleId = null;

    await connection.beginTransaction();

    try {
      // Verify time slot exists and is active
      const [slotRows] = await connection.execute<RowDataPacket[]>(
        `SELECT slot_id, slot_name, min_lead_days, max_advance_days, available_days 
         FROM delivery_time_slots 
         WHERE slot_id = ? AND is_active = TRUE`,
        [body.time_slot_id]
      );

      if (slotRows.length === 0) {
        throw new Error('Invalid or inactive time slot');
      }

      const slot = slotRows[0];

      // Check lead time
      const daysFromToday = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysFromToday < slot.min_lead_days) {
        throw new Error(`Delivery must be scheduled at least ${slot.min_lead_days} days in advance`);
      }

      if (daysFromToday > slot.max_advance_days) {
        throw new Error(`Delivery cannot be scheduled more than ${slot.max_advance_days} days in advance`);
      }

      // Check day of week availability
      const dayOfWeek = deliveryDate.getDay();
      const availableDays = JSON.parse(slot.available_days);
      if (!availableDays.includes(dayOfWeek)) {
        throw new Error('Selected time slot is not available on this day of the week');
      }

      // Check blackout dates
      const [blackouts] = await connection.execute<RowDataPacket[]>(
        `SELECT blackout_name, notification_message 
         FROM delivery_blackout_dates 
         WHERE blackout_date = ? 
         AND (applies_to_all_slots = TRUE 
              OR (applies_to_all_slots = FALSE 
                  AND JSON_CONTAINS(specific_slot_ids, CAST(? AS JSON))))`,
        [body.delivery_date, body.time_slot_id]
      );

      if (blackouts.length > 0) {
        const message = blackouts[0].notification_message || `Delivery not available on ${body.delivery_date}`;
        throw new Error(message);
      }

      // Check capacity (trigger will also check, but we want a user-friendly error)
      const [capacity] = await connection.execute<RowDataPacket[]>(
        `SELECT available_capacity, is_blocked, block_reason 
         FROM delivery_capacity 
         WHERE delivery_date = ? AND time_slot_id = ?`,
        [body.delivery_date, body.time_slot_id]
      );

      if (capacity.length > 0 && capacity[0].is_blocked) {
        throw new Error(capacity[0].block_reason || 'This delivery slot is not available');
      }

      if (capacity.length > 0 && capacity[0].available_capacity <= 0) {
        throw new Error('No delivery capacity available for selected date and time');
      }

      // If rescheduling, update existing schedule
      if (isReschedule) {
        const existingData = existingSchedule[0];
        previousScheduleId = existingData.schedule_id;

        // Update existing schedule to rescheduled status
        await connection.execute(
          'UPDATE order_delivery_schedules SET status = ? WHERE schedule_id = ?',
          ['rescheduled', previousScheduleId]
        );

        // Record reschedule history
        await connection.execute(
          `INSERT INTO delivery_reschedule_history (
            order_id, schedule_id, old_delivery_date, old_time_slot_id,
            new_delivery_date, new_time_slot_id, reschedule_reason,
            requested_by, requested_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            body.order_id,
            previousScheduleId,
            existingData.delivery_date,
            existingData.time_slot_id,
            body.delivery_date,
            body.time_slot_id,
            body.customer_notes || 'Customer requested reschedule',
            'customer',
            user.userId
          ]
        );
      }

      // Create new delivery schedule
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO order_delivery_schedules (
          order_id, delivery_date, time_slot_id, specific_time_requested,
          customer_notes, alternative_recipient, alternative_phone,
          delivery_location, location_details, access_instructions,
          notification_preferences, notify_on_day_before, notify_on_delivery_day,
          notify_one_hour_before, status, original_delivery_date, rescheduled_from
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          body.order_id,
          body.delivery_date,
          body.time_slot_id,
          body.specific_time_requested || null,
          body.customer_notes || null,
          body.alternative_recipient || null,
          body.alternative_phone || null,
          body.delivery_location || 'front_door',
          body.location_details || null,
          body.access_instructions || null,
          body.notification_preferences ? JSON.stringify(body.notification_preferences) : '{"email": true}',
          body.notify_on_day_before !== false,
          body.notify_on_delivery_day !== false,
          body.notify_one_hour_before !== false,
          'scheduled',
          isReschedule ? existingSchedule[0].delivery_date : null,
          previousScheduleId
        ]
      );

      // Update order with preferred delivery info
      await connection.execute(
        'UPDATE orders SET preferred_delivery_date = ?, preferred_time_slot_id = ? WHERE order_id = ?',
        [body.delivery_date, body.time_slot_id, body.order_id]
      );

      await connection.commit();

      // Fetch the created schedule with slot details
      const [newSchedule] = await connection.execute<RowDataPacket[]>(
        `SELECT 
          s.schedule_id, s.order_id, s.delivery_date, s.time_slot_id,
          s.specific_time_requested, s.customer_notes, s.delivery_location,
          s.notification_preferences, s.status, s.created_at,
          t.slot_name, t.slot_code, t.start_time, t.end_time, t.additional_fee
         FROM order_delivery_schedules s
         JOIN delivery_time_slots t ON s.time_slot_id = t.slot_id
         WHERE s.schedule_id = ?`,
        [result.insertId]
      );

      const schedule = newSchedule[0];
      return NextResponse.json({
        success: true,
        message: isReschedule ? 'Delivery rescheduled successfully' : 'Delivery scheduled successfully',
        schedule: {
          scheduleId: schedule.schedule_id,
          orderId: schedule.order_id,
          deliveryDate: schedule.delivery_date,
          timeSlot: {
            id: schedule.time_slot_id,
            name: schedule.slot_name,
            code: schedule.slot_code,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            additionalFee: parseFloat(schedule.additional_fee)
          },
          specificTimeRequested: schedule.specific_time_requested,
          customerNotes: schedule.customer_notes,
          deliveryLocation: schedule.delivery_location,
          notificationPreferences: JSON.parse(schedule.notification_preferences),
          status: schedule.status,
          createdAt: schedule.created_at
        },
        isReschedule,
        previousScheduleId
      });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Error scheduling delivery:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to schedule delivery' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// GET /api/delivery/schedule - Get delivery schedule for an order
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify order belongs to user
    const [orderRows] = await pool.execute<RowDataPacket[]>(
      'SELECT order_id FROM orders WHERE order_id = ? AND (customer_id = ? OR customer_id IS NULL)',
      [orderId, user.userId]
    );

    if (orderRows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get delivery schedule
    const [schedules] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        s.schedule_id, s.order_id, s.delivery_date, s.time_slot_id,
        s.specific_time_requested, s.customer_notes, s.alternative_recipient,
        s.alternative_phone, s.delivery_location, s.location_details,
        s.access_instructions, s.notification_preferences,
        s.notify_on_day_before, s.notify_on_delivery_day, s.notify_one_hour_before,
        s.status, s.confirmed_at, s.delivered_at, s.delivered_by,
        s.recipient_name, s.failure_reason, s.failure_count,
        s.original_delivery_date, s.reschedule_reason, s.created_at, s.updated_at,
        t.slot_name, t.slot_code, t.start_time, t.end_time,
        t.additional_fee, t.requires_signature
       FROM order_delivery_schedules s
       JOIN delivery_time_slots t ON s.time_slot_id = t.slot_id
       WHERE s.order_id = ?
       ORDER BY s.created_at DESC`,
      [orderId]
    );

    if (schedules.length === 0) {
      return NextResponse.json({
        success: true,
        schedule: null,
        message: 'No delivery scheduled for this order'
      });
    }

    const schedule = schedules[0];

    // Get reschedule history if any
    const [rescheduleHistory] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        h.history_id, h.old_delivery_date, h.old_time_slot_id,
        h.new_delivery_date, h.new_time_slot_id, h.reschedule_reason,
        h.requested_by, h.created_at,
        ot.slot_name as old_slot_name, nt.slot_name as new_slot_name
       FROM delivery_reschedule_history h
       JOIN delivery_time_slots ot ON h.old_time_slot_id = ot.slot_id
       JOIN delivery_time_slots nt ON h.new_time_slot_id = nt.slot_id
       WHERE h.order_id = ?
       ORDER BY h.created_at DESC`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      schedule: {
        scheduleId: schedule.schedule_id,
        orderId: schedule.order_id,
        deliveryDate: schedule.delivery_date,
        timeSlot: {
          id: schedule.time_slot_id,
          name: schedule.slot_name,
          code: schedule.slot_code,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          additionalFee: parseFloat(schedule.additional_fee),
          requiresSignature: schedule.requires_signature
        },
        specificTimeRequested: schedule.specific_time_requested,
        customerNotes: schedule.customer_notes,
        alternativeRecipient: schedule.alternative_recipient,
        alternativePhone: schedule.alternative_phone,
        deliveryLocation: schedule.delivery_location,
        locationDetails: schedule.location_details,
        accessInstructions: schedule.access_instructions,
        notificationPreferences: JSON.parse(schedule.notification_preferences),
        notifications: {
          dayBefore: schedule.notify_on_day_before,
          deliveryDay: schedule.notify_on_delivery_day,
          oneHourBefore: schedule.notify_one_hour_before
        },
        status: schedule.status,
        confirmedAt: schedule.confirmed_at,
        deliveredAt: schedule.delivered_at,
        deliveredBy: schedule.delivered_by,
        recipientName: schedule.recipient_name,
        failureReason: schedule.failure_reason,
        failureCount: schedule.failure_count,
        originalDeliveryDate: schedule.original_delivery_date,
        rescheduleReason: schedule.reschedule_reason,
        createdAt: schedule.created_at,
        updatedAt: schedule.updated_at
      },
      rescheduleHistory: rescheduleHistory.map(h => ({
        historyId: h.history_id,
        oldDeliveryDate: h.old_delivery_date,
        oldSlotName: h.old_slot_name,
        newDeliveryDate: h.new_delivery_date,
        newSlotName: h.new_slot_name,
        reason: h.reschedule_reason,
        requestedBy: h.requested_by,
        createdAt: h.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching delivery schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery schedule' },
      { status: 500 }
    );
  }
}