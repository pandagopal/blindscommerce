import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface WarrantyRegistration {
  product_id: number;
  customer_id: number;
  serial_number: string;
  purchase_date: string;
  registration_date: string;
  warranty_type: 'standard' | 'extended';
  warranty_duration_months: number;
}

interface WarrantyRow extends RowDataPacket {
  warranty_id: number;
  serial_number: string;
  warranty_type: string;
  warranty_duration_months: number;
  registration_date: string;
  purchase_date: string;
}

export async function POST(request: NextRequest) {
  try {
    const pool = await getPool();
    const body = await request.json();
    
    const {
      product_id,
      customer_id,
      serial_number,
      purchase_date,
      warranty_type = 'standard',
      warranty_duration_months = 12
    } = body;

    // Validate required fields
    if (!product_id || !customer_id || !serial_number || !purchase_date) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, customer_id, serial_number, purchase_date' },
        { status: 400 }
      );
    }

    // Check if warranty already registered for this serial number
    const [existingWarranty] = await pool.execute<WarrantyRow[]>(
      `SELECT warranty_id FROM product_warranties WHERE serial_number = ?`,
      [serial_number]
    );

    if (existingWarranty.length > 0) {
      return NextResponse.json(
        { error: 'Warranty already registered for this serial number' },
        { status: 409 }
      );
    }

    // Register warranty
    const [result] = await pool.execute(
      `INSERT INTO product_warranties 
       (product_id, customer_id, serial_number, purchase_date, registration_date, 
        warranty_type, warranty_duration_months, status) 
       VALUES (?, ?, ?, ?, NOW(), ?, ?, 'active')`,
      [product_id, customer_id, serial_number, purchase_date, warranty_type, warranty_duration_months]
    );

    const warranty_id = (result as any).insertId;

    // Get the created warranty details
    const [warranty] = await pool.execute<WarrantyRow[]>(
      `SELECT pw.*, p.name as product_name, u.first_name, u.last_name
       FROM product_warranties pw
       JOIN products p ON pw.product_id = p.product_id
       JOIN users u ON pw.customer_id = u.user_id
       WHERE pw.warranty_id = ?`,
      [warranty_id]
    );

    return NextResponse.json({
      success: true,
      warranty: warranty[0],
      message: 'Warranty registered successfully'
    });

  } catch (error) {
    console.error('Error registering warranty:', error);
    return NextResponse.json(
      { error: 'Failed to register warranty' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const pool = await getPool();
    const { searchParams } = new URL(request.url);
    const customer_id = searchParams.get('customer_id');
    const serial_number = searchParams.get('serial_number');

    if (!customer_id && !serial_number) {
      return NextResponse.json(
        { error: 'Either customer_id or serial_number is required' },
        { status: 400 }
      );
    }

    let query = `
      SELECT pw.*, p.name as product_name, p.slug as product_slug,
             CASE 
               WHEN DATE_ADD(pw.purchase_date, INTERVAL pw.warranty_duration_months MONTH) > NOW() 
               THEN 'active'
               ELSE 'expired'
             END as warranty_status,
             DATE_ADD(pw.purchase_date, INTERVAL pw.warranty_duration_months MONTH) as expiry_date
      FROM product_warranties pw
      JOIN products p ON pw.product_id = p.product_id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (customer_id) {
      query += ` AND pw.customer_id = ?`;
      params.push(customer_id);
    }

    if (serial_number) {
      query += ` AND pw.serial_number = ?`;
      params.push(serial_number);
    }

    query += ` ORDER BY pw.registration_date DESC`;

    const [warranties] = await pool.execute<WarrantyRow[]>(query, params);

    return NextResponse.json({
      success: true,
      warranties
    });

  } catch (error) {
    console.error('Error fetching warranties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warranties' },
      { status: 500 }
    );
  }
}