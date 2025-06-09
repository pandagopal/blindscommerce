import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface WarrantyClaim {
  warranty_id: number;
  customer_id: number;
  claim_type: 'repair' | 'replacement' | 'refund';
  issue_description: string;
  claim_date: string;
  status: 'pending' | 'approved' | 'denied' | 'resolved';
}

interface ClaimRow extends RowDataPacket {
  claim_id: number;
  warranty_id: number;
  customer_id: number;
  claim_type: string;
  issue_description: string;
  claim_date: string;
  status: string;
  resolution_notes?: string;
  resolved_date?: string;
}

export async function POST(request: NextRequest) {
  try {
    const pool = await getPool();
    const body = await request.json();
    
    const {
      warranty_id,
      customer_id,
      claim_type,
      issue_description,
      photos = []
    } = body;

    // Validate required fields
    if (!warranty_id || !customer_id || !claim_type || !issue_description) {
      return NextResponse.json(
        { error: 'Missing required fields: warranty_id, customer_id, claim_type, issue_description' },
        { status: 400 }
      );
    }

    // Verify warranty exists and belongs to customer
    const [warranty] = await pool.execute<RowDataPacket[]>(
      `SELECT pw.*, 
              DATE_ADD(pw.purchase_date, INTERVAL pw.warranty_duration_months MONTH) as expiry_date
       FROM product_warranties pw 
       WHERE pw.warranty_id = ? AND pw.customer_id = ?`,
      [warranty_id, customer_id]
    );

    if (warranty.length === 0) {
      return NextResponse.json(
        { error: 'Warranty not found or does not belong to customer' },
        { status: 404 }
      );
    }

    // Check if warranty is still active
    const warrantyData = warranty[0];
    const now = new Date();
    const expiryDate = new Date(warrantyData.expiry_date);
    
    if (now > expiryDate) {
      return NextResponse.json(
        { error: 'Warranty has expired' },
        { status: 400 }
      );
    }

    // Create warranty claim
    const [result] = await pool.execute(
      `INSERT INTO warranty_claims 
       (warranty_id, customer_id, claim_type, issue_description, claim_date, status) 
       VALUES (?, ?, ?, ?, NOW(), 'pending')`,
      [warranty_id, customer_id, claim_type, issue_description]
    );

    const claim_id = (result as any).insertId;

    // Handle photo uploads if provided
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        await pool.execute(
          `INSERT INTO warranty_claim_photos (claim_id, photo_url, uploaded_date) 
           VALUES (?, ?, NOW())`,
          [claim_id, photo]
        );
      }
    }

    // Get the created claim with details
    const [claim] = await pool.execute<ClaimRow[]>(
      `SELECT wc.*, pw.serial_number, p.name as product_name
       FROM warranty_claims wc
       JOIN product_warranties pw ON wc.warranty_id = pw.warranty_id
       JOIN products p ON pw.product_id = p.product_id
       WHERE wc.claim_id = ?`,
      [claim_id]
    );

    return NextResponse.json({
      success: true,
      claim: claim[0],
      message: 'Warranty claim submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting warranty claim:', error);
    return NextResponse.json(
      { error: 'Failed to submit warranty claim' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const pool = await getPool();
    const { searchParams } = new URL(request.url);
    const customer_id = searchParams.get('customer_id');
    const claim_id = searchParams.get('claim_id');
    const status = searchParams.get('status');

    let query = `
      SELECT wc.*, pw.serial_number, p.name as product_name, p.slug as product_slug,
             u.first_name, u.last_name, u.email
      FROM warranty_claims wc
      JOIN product_warranties pw ON wc.warranty_id = pw.warranty_id
      JOIN products p ON pw.product_id = p.product_id
      JOIN users u ON wc.customer_id = u.user_id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (customer_id) {
      query += ` AND wc.customer_id = ?`;
      params.push(customer_id);
    }

    if (claim_id) {
      query += ` AND wc.claim_id = ?`;
      params.push(claim_id);
    }

    if (status) {
      query += ` AND wc.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY wc.claim_date DESC`;

    const [claims] = await pool.execute<ClaimRow[]>(query, params);

    // Get photos for each claim
    for (const claim of claims) {
      const [photos] = await pool.execute<RowDataPacket[]>(
        `SELECT photo_url, uploaded_date FROM warranty_claim_photos WHERE claim_id = ?`,
        [claim.claim_id]
      );
      (claim as any).photos = photos;
    }

    return NextResponse.json({
      success: true,
      claims
    });

  } catch (error) {
    console.error('Error fetching warranty claims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warranty claims' },
      { status: 500 }
    );
  }
}