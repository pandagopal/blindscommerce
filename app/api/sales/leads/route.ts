import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Lead extends RowDataPacket {
  lead_id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
  priority: string;
  notes: string;
  assigned_to: number;
  created_at: Date;
  updated_at: Date;
  last_contact: Date;
}

// GET /api/sales/leads - Get leads for sales person
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'sales')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create leads table if it doesn't exist
    const pool = await getPool();
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        lead_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(255),
        source VARCHAR(100) DEFAULT 'website',
        status ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiating', 'closed_won', 'closed_lost') DEFAULT 'new',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        notes TEXT,
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_contact TIMESTAMP NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Build query with filters
    let query = `
      SELECT l.*, 
             CONCAT(u.first_name, ' ', u.last_name) as assigned_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.user_id
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];

    // Filter by sales person if not admin
    if (user.role === 'sales') {
      query += ' AND l.assigned_to = ?';
      queryParams.push(user.userId);
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      query += ' AND l.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY l.updated_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [leads] = await pool.execute<Lead[]>(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
    const countParams: any[] = [];

    if (user.role === 'sales') {
      countQuery += ' AND assigned_to = ?';
      countParams.push(user.userId);
    }

    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countParams);

    return NextResponse.json({
      leads: leads.map(lead => ({
        ...lead,
        priority: lead.priority || 'medium',
        source: lead.source || 'website'
      })),
      total: countResult[0].total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < countResult[0].total
      }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/sales/leads - Create new lead
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'sales')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, company, source, priority, notes } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO leads (
        name, email, phone, company, source, priority, notes, assigned_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        phone || null,
        company || null,
        source || 'website',
        priority || 'medium',
        notes || null,
        user.userId
      ]
    );

    return NextResponse.json({
      success: true,
      lead_id: result.insertId,
      message: 'Lead created successfully'
    });

  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}