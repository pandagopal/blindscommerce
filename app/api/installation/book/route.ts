import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface BookInstallationRequest {
  order_id: number;
  appointment_date: string;
  time_slot_id: number;
  installation_type: 'measurement' | 'installation' | 'repair' | 'consultation';
  estimated_duration_hours: number;
  preferred_technician_id?: number;
  
  // Installation details
  product_types: string[];
  room_count: number;
  window_count: number;
  special_requirements?: string;
  
  // Location details
  installation_address: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  access_instructions?: string;
  parking_instructions?: string;
  contact_phone: string;
  alternative_contact?: string;
}

interface OrderRow extends RowDataPacket {
  order_id: number;
  customer_id: number;
  status: string;
  total_amount: number;
}

interface TechnicianRow extends RowDataPacket {
  technician_id: number;
  first_name: string;
  last_name: string;
  skill_level: string;
  max_jobs_per_day: number;
}

interface TimeSlotRow extends RowDataPacket {
  slot_id: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  is_premium: boolean;
  premium_fee: number;
}

interface ServiceAreaRow extends RowDataPacket {
  area_id: number;
  base_fee: number;
  per_hour_rate: number;
  travel_fee: number;
}

// POST /api/installation/book - Book an installation appointment
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

    const body: BookInstallationRequest = await req.json();

    // Validate required fields
    if (!body.order_id || !body.appointment_date || !body.time_slot_id || 
        !body.installation_type || !body.installation_address || !body.contact_phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate appointment date
    const appointmentDate = new Date(body.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid appointment date format' },
        { status: 400 }
      );
    }

    if (appointmentDate < today) {
      return NextResponse.json(
        { error: 'Appointment date cannot be in the past' },
        { status: 400 }
      );
    }

    // Check minimum lead time (3 days)
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    if (appointmentDate < threeDaysFromNow) {
      return NextResponse.json(
        { error: 'Installation must be scheduled at least 3 days in advance' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    connection = await pool.getConnection();

    // Verify order belongs to user
    const [orderRows] = await connection.execute<OrderRow[]>(
      'SELECT order_id, customer_id, status, total_amount FROM orders WHERE order_id = ? AND customer_id = ?',
      [body.order_id, user.userId]
    );

    if (orderRows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderRows[0];

    // Check if order is in valid status for installation booking
    const validStatuses = ['pending', 'confirmed', 'processing'];
    if (!validStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot book installation for order with status: ${order.status}` },
        { status: 400 }
      );
    }

    // Check if installation is already booked for this order
    const [existingAppointment] = await connection.execute<RowDataPacket[]>(
      'SELECT appointment_id FROM installation_appointments WHERE order_id = ? AND status NOT IN ("cancelled")',
      [body.order_id]
    );

    if (existingAppointment.length > 0) {
      return NextResponse.json(
        { error: 'Installation appointment already exists for this order' },
        { status: 400 }
      );
    }

    // Transaction handling with pool - consider using connection from pool

    try {
      // Verify time slot exists and is active
      const [slotRows] = await connection.execute<TimeSlotRow[]>(
        'SELECT * FROM installation_time_slots WHERE slot_id = ? AND is_active = TRUE',
        [body.time_slot_id]
      );

      if (slotRows.length === 0) {
        throw new Error('Invalid or inactive time slot');
      }

      const timeSlot = slotRows[0];

      // Check if slot duration can accommodate estimated duration
      if (timeSlot.duration_hours < body.estimated_duration_hours) {
        throw new Error(`Selected time slot (${timeSlot.duration_hours}h) is shorter than estimated duration (${body.estimated_duration_hours}h)`);
      }

      // Find service area based on address
      const [serviceAreaRows] = await connection.execute<ServiceAreaRow[]>(
        `SELECT * FROM installation_service_areas 
         WHERE JSON_CONTAINS(states_provinces, ?) AND is_active = TRUE 
         ORDER BY area_id LIMIT 1`,
        [JSON.stringify(body.installation_address.state)]
      );

      if (serviceAreaRows.length === 0) {
        throw new Error('Installation service not available in your area');
      }

      const serviceArea = serviceAreaRows[0];

      // Find available technician
      let assignedTechnicianId = body.preferred_technician_id;

      if (assignedTechnicianId) {
        // Verify preferred technician is available
        const [techAvail] = await connection.execute<RowDataPacket[]>(
          `SELECT t.*, COUNT(a.appointment_id) as current_appointments
           FROM installation_technicians t
           LEFT JOIN installation_appointments a ON t.technician_id = a.assigned_technician_id 
             AND a.appointment_date = ? AND a.time_slot_id = ? 
             AND a.status IN ('scheduled', 'confirmed', 'in_progress')
           WHERE t.technician_id = ? AND t.is_active = TRUE AND t.availability_status = 'available'
           GROUP BY t.technician_id`,
          [body.appointment_date, body.time_slot_id, assignedTechnicianId]
        );

        if (techAvail.length === 0 || (techAvail[0] as any).current_appointments >= (techAvail[0] as any).max_jobs_per_day) {
          throw new Error('Preferred technician is not available for the selected date and time');
        }
      } else {
        // Auto-assign best available technician
        const [availableTechs] = await connection.execute<TechnicianRow[]>(
          `SELECT t.*, COUNT(a.appointment_id) as current_appointments,
                  CASE 
                    WHEN t.primary_service_area_id = ? THEN 1
                    ELSE 2
                  END as area_priority
           FROM installation_technicians t
           LEFT JOIN installation_appointments a ON t.technician_id = a.assigned_technician_id 
             AND a.appointment_date = ? AND a.time_slot_id = ? 
             AND a.status IN ('scheduled', 'confirmed', 'in_progress')
           WHERE t.is_active = TRUE AND t.availability_status = 'available'
           AND (t.primary_service_area_id = ? 
                OR JSON_CONTAINS(COALESCE(t.secondary_service_areas, '[]'), ?))
           GROUP BY t.technician_id
           HAVING current_appointments < t.max_jobs_per_day
           ORDER BY area_priority ASC, t.average_rating DESC, current_appointments ASC
           LIMIT 1`,
          [serviceArea.area_id, body.appointment_date, body.time_slot_id, serviceArea.area_id, JSON.stringify(serviceArea.area_id)]
        );

        if (availableTechs.length === 0) {
          throw new Error('No technicians available for the selected date and time');
        }

        assignedTechnicianId = availableTechs[0].technician_id;
      }

      // Calculate pricing
      const baseCost = serviceArea.base_fee;
      const hourlyRate = serviceArea.per_hour_rate;
      const premiumFee = timeSlot.is_premium ? timeSlot.premium_fee : 0;
      const travelFee = serviceArea.travel_fee;
      
      const laborCost = hourlyRate * body.estimated_duration_hours;
      const totalCost = baseCost + laborCost + premiumFee + travelFee;

      // Create installation appointment
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO installation_appointments (
          order_id, customer_id, appointment_date, time_slot_id, estimated_duration_hours,
          assigned_technician_id, installation_type, product_types, room_count, window_count,
          special_requirements, installation_address, access_instructions, parking_instructions,
          contact_phone, alternative_contact, base_cost, additional_fees, total_cost, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          body.order_id,
          user.userId,
          body.appointment_date,
          body.time_slot_id,
          body.estimated_duration_hours,
          assignedTechnicianId,
          body.installation_type,
          JSON.stringify(body.product_types),
          body.room_count,
          body.window_count,
          body.special_requirements || null,
          JSON.stringify(body.installation_address),
          body.access_instructions || null,
          body.parking_instructions || null,
          body.contact_phone,
          body.alternative_contact || null,
          baseCost,
          JSON.stringify({
            labor: laborCost,
            premium_time: premiumFee,
            travel: travelFee
          }),
          totalCost,
          'scheduled'
        ]
      );

      const appointmentId = result.insertId;

      // Update order with installation appointment reference
      await pool.execute(
        'UPDATE orders SET installation_appointment_id = ? WHERE order_id = ?',
        [appointmentId, body.order_id]
      );

      // Mark technician as unavailable for this specific slot
      await pool.execute(
        `INSERT INTO technician_availability (technician_id, availability_date, time_slot_id, is_available, unavailable_reason)
         VALUES (?, ?, ?, FALSE, 'booked')
         ON DUPLICATE KEY UPDATE is_available = FALSE, unavailable_reason = 'booked'`,
        [assignedTechnicianId, body.appointment_date, body.time_slot_id]
      );

      // Commit handling needs review with pool

      // Fetch created appointment with details
      const [appointmentDetails] = await connection.execute<RowDataPacket[]>(
        `SELECT 
          a.*, 
          t.first_name as tech_first_name, t.last_name as tech_last_name,
          t.phone as tech_phone, t.skill_level,
          s.slot_name, s.start_time, s.end_time
         FROM installation_appointments a
         JOIN installation_technicians t ON a.assigned_technician_id = t.technician_id
         JOIN installation_time_slots s ON a.time_slot_id = s.slot_id
         WHERE a.appointment_id = ?`,
        [appointmentId]
      );

      const appointment = appointmentDetails[0];

      return NextResponse.json({
        success: true,
        message: 'Installation appointment booked successfully',
        appointment: {
          appointmentId: appointment.appointment_id,
          orderId: appointment.order_id,
          appointmentDate: appointment.appointment_date,
          timeSlot: {
            id: appointment.time_slot_id,
            name: appointment.slot_name,
            startTime: appointment.start_time,
            endTime: appointment.end_time
          },
          estimatedDuration: appointment.estimated_duration_hours,
          installationType: appointment.installation_type,
          assignedTechnician: {
            id: appointment.assigned_technician_id,
            name: `${appointment.tech_first_name} ${appointment.tech_last_name}`,
            phone: appointment.tech_phone,
            skillLevel: appointment.skill_level
          },
          installationAddress: JSON.parse(appointment.installation_address),
          contactPhone: appointment.contact_phone,
          pricing: {
            baseCost,
            additionalFees: JSON.parse(appointment.additional_fees),
            totalCost
          },
          status: appointment.status,
          createdAt: appointment.created_at
        }
      });

    } catch (transactionError) {
      // Rollback handling needs review with pool
      throw transactionError;
    }

  } catch (error) {
    console.error('Error booking installation:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to book installation appointment' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}