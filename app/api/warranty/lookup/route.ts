import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const pool = await getPool();
    const { searchParams } = new URL(request.url);
    const serial_number = searchParams.get('serial_number');

    if (!serial_number) {
      return NextResponse.json(
        { error: 'Serial number is required' },
        { status: 400 }
      );
    }

    // Look up warranty by serial number
    const [warranties] = await pool.execute<RowDataPacket[]>(
      `SELECT pw.*, p.name as product_name, p.slug as product_slug,
              p.description, p.base_price,
              CASE 
                WHEN DATE_ADD(pw.purchase_date, INTERVAL pw.warranty_duration_months MONTH) > NOW() 
                THEN 'active'
                ELSE 'expired'
              END as warranty_status,
              DATE_ADD(pw.purchase_date, INTERVAL pw.warranty_duration_months MONTH) as expiry_date,
              DATEDIFF(DATE_ADD(pw.purchase_date, INTERVAL pw.warranty_duration_months MONTH), NOW()) as days_remaining
       FROM product_warranties pw
       JOIN products p ON pw.product_id = p.product_id
       WHERE pw.serial_number = ?`,
      [serial_number]
    );

    if (warranties.length === 0) {
      return NextResponse.json(
        { error: 'No warranty found for this serial number' },
        { status: 404 }
      );
    }

    const warranty = warranties[0];

    // Get any existing claims for this warranty
    const [claims] = await pool.execute<RowDataPacket[]>(
      `SELECT claim_id, claim_type, issue_description, claim_date, status, resolution_notes
       FROM warranty_claims 
       WHERE warranty_id = ? 
       ORDER BY claim_date DESC`,
      [warranty.warranty_id]
    );

    // Get product images
    const [images] = await pool.execute<RowDataPacket[]>(
      `SELECT image_url, is_primary 
       FROM product_images 
       WHERE product_id = ? 
       ORDER BY is_primary DESC, display_order ASC`,
      [warranty.product_id]
    );

    return NextResponse.json({
      success: true,
      warranty: {
        ...warranty,
        claims,
        product_images: images
      }
    });

  } catch (error) {
    console.error('Error looking up warranty:', error);
    return NextResponse.json(
      { error: 'Failed to lookup warranty' },
      { status: 500 }
    );
  }
}