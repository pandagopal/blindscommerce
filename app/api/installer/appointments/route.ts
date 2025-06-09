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
    
    // Mock data for now - in a real app, this would come from the database
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        customerName: 'John Smith',
        address: '123 Main St, Austin, TX 78701',
        date: new Date().toISOString().split('T')[0], // Today
        time: '10:00 AM',
        status: 'scheduled',
        type: 'installation'
      },
      {
        id: '2',
        customerName: 'Sarah Johnson',
        address: '456 Oak Ave, Austin, TX 78702',
        date: new Date().toISOString().split('T')[0], // Today
        time: '2:00 PM',
        status: 'in-progress',
        type: 'measurement'
      },
      {
        id: '3',
        customerName: 'Mike Davis',
        address: '789 Pine St, Austin, TX 78703',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        time: '9:00 AM',
        status: 'scheduled',
        type: 'installation'
      },
      {
        id: '4',
        customerName: 'Emma Wilson',
        address: '321 Elm St, Austin, TX 78704',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
        time: '11:00 AM',
        status: 'scheduled',
        type: 'repair'
      }
    ];

    return NextResponse.json(mockAppointments);
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
    const { customerName, address, date, time, type } = body;

    // Validate required fields
    if (!customerName || !address || !date || !time || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new appointment
    const newAppointment: Appointment = {
      id: `APT-${Date.now()}`,
      customerName,
      address,
      date,
      time,
      status: 'scheduled',
      type
    };

    // In a real implementation, you would save to database
    // const pool = await getPool();
    // await pool.query(...);

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