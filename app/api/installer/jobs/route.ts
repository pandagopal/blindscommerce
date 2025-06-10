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
    
    // Get search parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const jobType = searchParams.get('job_type');
    const priority = searchParams.get('priority');
    const date = searchParams.get('date');
    const installerId = searchParams.get('installer_id') || user.user_id;

    // Build dynamic query for jobs
    let jobQuery = `
      SELECT 
        ij.job_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.phone as customer_phone,
        CONCAT(sa.address_line_1, ', ', sa.city, ', ', sa.state, ' ', sa.postal_code) as address,
        ij.job_type,
        ij.status,
        ij.priority,
        DATE(ij.scheduled_datetime) as scheduled_date,
        TIME_FORMAT(ij.scheduled_datetime, '%H:%i') as scheduled_time,
        ij.estimated_duration,
        ij.special_instructions,
        ij.notes,
        ij.completion_notes,
        ij.customer_satisfaction,
        ij.created_at,
        ij.completed_at,
        CONCAT(installer.first_name, ' ', installer.last_name) as assigned_installer
      FROM installer_jobs ij
      JOIN users u ON ij.customer_id = u.user_id
      LEFT JOIN shipping_addresses sa ON ij.address_id = sa.address_id
      LEFT JOIN users installer ON ij.installer_id = installer.user_id
      WHERE ij.installer_id = ?
    `;
    
    const queryParams = [installerId];

    if (status) {
      jobQuery += ' AND ij.status = ?';
      queryParams.push(status);
    }

    if (jobType) {
      jobQuery += ' AND ij.job_type = ?';
      queryParams.push(jobType);
    }

    if (priority) {
      jobQuery += ' AND ij.priority = ?';
      queryParams.push(priority);
    }

    if (date) {
      jobQuery += ' AND DATE(ij.scheduled_datetime) = ?';
      queryParams.push(date);
    }

    jobQuery += ' ORDER BY ij.scheduled_datetime ASC';

    const [jobRows] = await pool.query(jobQuery, queryParams);
    const jobs = jobRows as any[];

    // Get products and materials for each job
    const jobsWithDetails = await Promise.all(jobs.map(async (job) => {
      // Get job products
      const [productRows] = await pool.query(
        `SELECT 
          jp.job_product_id as id,
          p.name,
          jp.quantity,
          jp.room_location as room,
          jp.specifications
        FROM job_products jp
        JOIN products p ON jp.product_id = p.product_id
        WHERE jp.job_id = ?`,
        [job.id]
      );

      // Get job materials
      const [materialRows] = await pool.query(
        `SELECT material_name
        FROM job_materials 
        WHERE job_id = ?`,
        [job.id]
      );

      return {
        ...job,
        products: productRows as JobProduct[],
        materials_needed: (materialRows as any[]).map(m => m.material_name)
      };
    }));

    // Calculate stats from real data
    const [statsRows] = await pool.query(
      `SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
        SUM(CASE WHEN status IN ('scheduled', 'assigned') THEN 1 ELSE 0 END) as pending_jobs,
        SUM(CASE WHEN DATE(scheduled_datetime) = CURDATE() THEN 1 ELSE 0 END) as today_jobs,
        AVG(CASE WHEN status = 'completed' AND estimated_duration > 0 THEN estimated_duration ELSE NULL END) as avg_completion_time,
        AVG(CASE WHEN customer_satisfaction > 0 THEN customer_satisfaction ELSE NULL END) as customer_rating
      FROM installer_jobs 
      WHERE installer_id = ?`,
      [installerId]
    );

    const rawStats = (statsRows as any[])[0];
    const stats: JobStats = {
      total_jobs: parseInt(rawStats.total_jobs) || 0,
      completed_jobs: parseInt(rawStats.completed_jobs) || 0,
      pending_jobs: parseInt(rawStats.pending_jobs) || 0,
      today_jobs: parseInt(rawStats.today_jobs) || 0,
      avg_completion_time: parseFloat(rawStats.avg_completion_time) || 0,
      customer_rating: parseFloat(rawStats.customer_rating) || 0
    };

    return NextResponse.json({
      jobs: jobsWithDetails,
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