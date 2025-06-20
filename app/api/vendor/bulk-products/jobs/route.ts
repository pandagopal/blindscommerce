import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface BulkJobRow extends RowDataPacket {
  job_id: string;
  operation_type: string;
  status: string;
  file_name: string;
  total_records: number;
  processed_records: number;
  success_count: number;
  error_count: number;
  errors: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      );
    }

    // Get vendor info
    const pool = await getPool();
    const [vendors] = await pool.execute(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ? AND is_active = 1',
      [user.userId]
    );

    if (!Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      );
    }

    const vendorId = (vendors[0] as any).vendor_info_id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build query
    let whereClause = 'WHERE vendor_id = ?';
    const queryParams: any[] = [vendorId];

    if (status && ['pending', 'processing', 'completed', 'failed', 'completed_with_errors'].includes(status)) {
      whereClause += ' AND status = ?';
      queryParams.push(status);
    }

    queryParams.push(limit, offset);

    const [jobs] = await pool.query<BulkJobRow[]>(
      `SELECT 
        job_id,
        operation_type,
        status,
        file_name,
        total_records,
        processed_records,
        success_count,
        error_count,
        errors,
        error_message,
        created_at,
        started_at,
        completed_at
      FROM bulk_product_jobs 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      queryParams
    );

    // Parse errors JSON for each job
    const jobsWithParsedErrors = jobs.map(job => ({
      ...job,
      errors: job.errors ? JSON.parse(job.errors) : null,
    }));

    return NextResponse.json({
      jobs: jobsWithParsedErrors,
      pagination: {
        limit,
        offset,
        total: jobs.length,
      },
    });

  } catch (error) {
    console.error('Error fetching bulk jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulk jobs' },
      { status: 500 }
    );
  }
}