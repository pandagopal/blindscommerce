import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { getPool } from '@/lib/db';

interface InstallerJob {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  job_type: 'installation' | 'repair' | 'measurement' | 'consultation';
  status: 'assigned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration: number;
  products: JobProduct[];
  materials_needed: string[];
  special_instructions: string;
  notes: string;
  completion_notes?: string;
  customer_satisfaction?: number;
  before_photos?: string[];
  after_photos?: string[];
  created_at: string;
  completed_at?: string;
  assigned_installer: string;
}

interface JobProduct {
  id: string;
  name: string;
  quantity: number;
  room: string;
  specifications: string;
}

interface JobStats {
  total_jobs: number;
  completed_jobs: number;
  pending_jobs: number;
  today_jobs: number;
  avg_completion_time: number;
  customer_rating: number;
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
    const mockJobs: InstallerJob[] = [
      {
        id: 'JOB-001',
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
          },
          {
            id: 'PROD-002',
            name: 'Plantation Shutters',
            quantity: 2,
            room: 'Master Bedroom',
            specifications: '60" x 36", White painted'
          }
        ],
        materials_needed: ['Mounting brackets', 'Wood screws', 'Wall anchors', 'Level'],
        special_instructions: 'Customer prefers morning installation. Use dust sheets.',
        notes: 'High-end installation. Take extra care with finishing.',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_installer: user.firstName + ' ' + user.lastName
      },
      {
        id: 'JOB-002',
        customer_name: 'David Thompson',
        customer_phone: '+1-555-0456',
        address: '456 Oak Ave, Dallas, TX 75201',
        job_type: 'repair',
        status: 'in_progress',
        priority: 'medium',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '14:00',
        estimated_duration: 120,
        products: [
          {
            id: 'PROD-003',
            name: 'Cellular Shades',
            quantity: 3,
            room: 'Office',
            specifications: 'Cord repair and cleaning'
          }
        ],
        materials_needed: ['Replacement cord', 'Cord locks', 'Cleaning supplies'],
        special_instructions: 'Commercial building. Check in with security.',
        notes: 'Customer reported cord mechanism failure.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_installer: user.firstName + ' ' + user.lastName
      },
      {
        id: 'JOB-003',
        customer_name: 'Jennifer Martinez',
        customer_phone: '+1-555-0789',
        address: '789 Pine Rd, Houston, TX 77001',
        job_type: 'measurement',
        status: 'completed',
        priority: 'low',
        scheduled_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduled_time: '10:30',
        estimated_duration: 90,
        products: [
          {
            id: 'PROD-004',
            name: 'Roller Shades',
            quantity: 5,
            room: 'Multiple Rooms',
            specifications: 'Measure for quote'
          }
        ],
        materials_needed: ['Measuring tape', 'Notebook', 'Camera'],
        special_instructions: 'Potential large order. Provide detailed measurements.',
        notes: 'Customer interested in motorized options.',
        completion_notes: 'All measurements taken. Quote to follow.',
        customer_satisfaction: 5,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        assigned_installer: user.firstName + ' ' + user.lastName
      }
    ];

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const stats: JobStats = {
      total_jobs: mockJobs.length,
      completed_jobs: mockJobs.filter(job => job.status === 'completed').length,
      pending_jobs: mockJobs.filter(job => job.status === 'scheduled' || job.status === 'assigned').length,
      today_jobs: mockJobs.filter(job => job.scheduled_date === today).length,
      avg_completion_time: 185, // minutes
      customer_rating: 4.8
    };

    return NextResponse.json({
      jobs: mockJobs,
      stats
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
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
    const {
      customer_name,
      customer_phone,
      address,
      job_type,
      scheduled_date,
      scheduled_time,
      priority,
      products,
      materials_needed,
      special_instructions,
      notes
    } = body;

    // Validate required fields
    if (!customer_name || !address || !job_type || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new job
    const newJob: InstallerJob = {
      id: `JOB-${Date.now()}`,
      customer_name,
      customer_phone: customer_phone || '',
      address,
      job_type,
      status: 'scheduled',
      priority: priority || 'medium',
      scheduled_date,
      scheduled_time,
      estimated_duration: 120, // Default 2 hours
      products: products || [],
      materials_needed: materials_needed || [],
      special_instructions: special_instructions || '',
      notes: notes || '',
      created_at: new Date().toISOString(),
      assigned_installer: user.firstName + ' ' + user.lastName
    };

    // In a real implementation, you would save to database
    // const pool = await getPool();
    // await pool.query(...);

    return NextResponse.json(
      { 
        message: 'Job created successfully',
        job: newJob 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}