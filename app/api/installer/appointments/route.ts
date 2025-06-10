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
      WHERE ia.installer_id = ?
    `;
    
    const queryParams = [installerId];

    if (status) {
      query += ' AND ia.status = ?';
      queryParams.push(status);
    }

    if (date) {
      query += ' AND DATE(ia.scheduled_datetime) = ?';
      queryParams.push(date);
    }

    if (type) {
      query += ' AND ia.appointment_type = ?';
      queryParams.push(type);
    }

    query += ' ORDER BY ia.scheduled_datetime ASC';

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

    // Insert new appointment
    const [result] = await pool.query(
      `INSERT INTO installer_appointments 
       (installer_id, customer_id, address_id, scheduled_datetime, appointment_type, status, notes, estimated_duration, created_at)
       VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, NOW())`,
      [user.user_id, customerId, addressId, scheduledDatetime, type, notes || null, estimatedDuration || 60]
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