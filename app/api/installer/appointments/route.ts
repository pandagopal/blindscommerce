import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { getPool } from '@/lib/db';

interface Appointment {
  id: string;
  customerName: string;
  address: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'installation' | 'measurement' | 'repair';
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has installer or admin role
    if (!hasRole(user, ['installer', 'admin'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pool = await getPool();
    
    // Get search parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const type = searchParams.get('type');
    const installerId = searchParams.get('installer_id') || user.user_id;

    // Build dynamic query with optional filters
    let query = `
      SELECT 
        ia.appointment_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        JSON_UNQUOTE(JSON_EXTRACT(ia.installation_address, '$.address_line_1')) as address,
        ia.appointment_date as date,
        CONCAT(ts.start_time, ' - ', ts.end_time) as time,
        ia.status,
        ia.installation_type as type,
        ia.completion_notes as notes,
        ia.estimated_duration_hours as estimated_duration
      FROM installation_appointments ia
      JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN installation_time_slots ts ON ia.time_slot_id = ts.slot_id
      WHERE ia.assigned_technician_id = ?
    `;
    
    const queryParams = [installerId];

    if (status) {
      query += ' AND ia.status = ?';
      queryParams.push(status);
    }

    if (date) {
      query += ' AND ia.appointment_date = ?';
      queryParams.push(date);
    }

    if (type) {
      query += ' AND ia.installation_type = ?';
      queryParams.push(type);
    }

    query += ' ORDER BY ia.appointment_date ASC, ts.start_time ASC';

    const [rows] = await pool.query(query, queryParams);
    const appointments = rows as Appointment[];

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has installer or admin role
    if (!hasRole(user, ['installer', 'admin'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { customerId, addressId, date, time, type, notes, estimatedDuration } = body;

    // Validate required fields
    if (!customerId || !addressId || !date || !time || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, addressId, date, time, type' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify customer exists
    const [customerRows] = await pool.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [customerId]
    );

    if ((customerRows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create scheduled datetime from date and time
    const scheduledDatetime = `${date} ${time}`;

    // Get or create a default time slot
    const [timeSlots] = await pool.query(
      'SELECT slot_id FROM installation_time_slots LIMIT 1'
    );
    
    const defaultTimeSlotId = (timeSlots as any[])[0]?.slot_id || 1;

    // Insert new appointment
    const [result] = await pool.query(
      `INSERT INTO installation_appointments 
       (assigned_technician_id, customer_id, appointment_date, time_slot_id, installation_type, 
        estimated_duration_hours, special_requirements, installation_address, contact_phone, 
        base_cost, total_cost, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW())`,
      [
        user.userId, 
        customerId, 
        date, 
        defaultTimeSlotId, 
        type, 
        (estimatedDuration || 60) / 60, // Convert minutes to hours
        notes || null,
        JSON.stringify({address_line_1: 'TBD', city: 'TBD', state: 'TBD'}), // Placeholder address
        'TBD', // Placeholder phone
        0, // Base cost placeholder
        0  // Total cost placeholder
      ]
    );

    const appointmentId = (result as any).insertId;

    // Fetch the created appointment with customer details
    const [appointmentRows] = await pool.query(
      `SELECT 
        ia.appointment_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        CONCAT(sa.address_line_1, ', ', sa.city, ', ', sa.state, ' ', sa.postal_code) as address,
        DATE(ia.scheduled_datetime) as date,
        TIME_FORMAT(ia.scheduled_datetime, '%h:%i %p') as time,
        ia.status,
        ia.appointment_type as type,
        ia.notes,
        ia.estimated_duration
      FROM installer_appointments ia
      JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN shipping_addresses sa ON ia.address_id = sa.address_id
      WHERE ia.appointment_id = ?`,
      [appointmentId]
    );

    const newAppointment = (appointmentRows as any[])[0];

    return NextResponse.json(
      { 
        message: 'Appointment created successfully',
        appointment: newAppointment 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}