import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Mock data - in a real app, fetch from database
    const job = {
      id,
      customer_name: 'Sarah Johnson',
      customer_phone: '+1-555-0123',
      address: '123 Maple St, Austin, TX 78701',
      job_type: 'installation',
      status: 'scheduled',
      priority: 'high',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      estimated_duration: 240,
      products: [
        {
          id: 'PROD-001',
          name: 'Premium Wood Blinds',
          quantity: 4,
          room: 'Living Room',
          specifications: '72" x 48", Mahogany finish'
        }
      ],
      materials_needed: ['Mounting brackets', 'Wood screws', 'Wall anchors', 'Level'],
      special_instructions: 'Customer prefers morning installation. Use dust sheets.',
      notes: 'High-end installation. Take extra care with finishing.',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      assigned_installer: user.firstName + ' ' + user.lastName
    };

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();
    const { 
      status, 
      completed_at, 
      completion_notes,
      customer_satisfaction,
      notes,
      priority,
      materials_needed
    } = body;

    // In a real app, this would update the database

    const updatedJob = {
      id,
      status,
      completed_at,
      completion_notes,
      customer_satisfaction,
      notes,
      priority,
      materials_needed,
      updated_at: new Date().toISOString(),
      updated_by: user.userId
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin role (only admins can delete)
    if (!hasRole(user, 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // In a real app, this would delete from database

    return NextResponse.json({ 
      success: true, 
      message: 'Job deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}