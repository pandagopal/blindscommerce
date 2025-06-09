import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface ClaimUpdateBody {
  status?: 'pending' | 'approved' | 'denied' | 'resolved';
  resolution_notes?: string;
  admin_notes?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pool = await getPool();
    const claim_id = params.id;

    const [claims] = await pool.execute<RowDataPacket[]>(
      `SELECT wc.*, pw.serial_number, p.name as product_name, p.slug as product_slug,
              u.first_name, u.last_name, u.email,
              pw.warranty_type, pw.warranty_duration_months, pw.purchase_date
       FROM warranty_claims wc
       JOIN product_warranties pw ON wc.warranty_id = pw.warranty_id
       JOIN products p ON pw.product_id = p.product_id
       JOIN users u ON wc.customer_id = u.user_id
       WHERE wc.claim_id = ?`,
      [claim_id]
    );

    if (claims.length === 0) {
      return NextResponse.json(
        { error: 'Warranty claim not found' },
        { status: 404 }
      );
    }

    // Get photos for the claim
    const [photos] = await pool.execute<RowDataPacket[]>(
      `SELECT photo_url, uploaded_date FROM warranty_claim_photos WHERE claim_id = ?`,
      [claim_id]
    );

    const claim = claims[0];
    (claim as any).photos = photos;

    return NextResponse.json({
      success: true,
      claim
    });

  } catch (error) {
    console.error('Error fetching warranty claim:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warranty claim' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pool = await getPool();
    const claim_id = params.id;
    const body: ClaimUpdateBody = await request.json();

    const { status, resolution_notes, admin_notes } = body;

    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // If status is resolved, set resolved_date
      if (status === 'resolved') {
        updateFields.push('resolved_date = NOW()');
      }
    }

    if (resolution_notes) {
      updateFields.push('resolution_notes = ?');
      updateValues.push(resolution_notes);
    }

    if (admin_notes) {
      updateFields.push('admin_notes = ?');
      updateValues.push(admin_notes);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields provided for update' },
        { status: 400 }
      );
    }

    updateValues.push(claim_id);

    await pool.execute(
      `UPDATE warranty_claims SET ${updateFields.join(', ')} WHERE claim_id = ?`,
      updateValues
    );

    // Get updated claim
    const [claims] = await pool.execute<RowDataPacket[]>(
      `SELECT wc.*, pw.serial_number, p.name as product_name,
              u.first_name, u.last_name, u.email
       FROM warranty_claims wc
       JOIN product_warranties pw ON wc.warranty_id = pw.warranty_id
       JOIN products p ON pw.product_id = p.product_id
       JOIN users u ON wc.customer_id = u.user_id
       WHERE wc.claim_id = ?`,
      [claim_id]
    );

    return NextResponse.json({
      success: true,
      claim: claims[0],
      message: 'Warranty claim updated successfully'
    });

  } catch (error) {
    console.error('Error updating warranty claim:', error);
    return NextResponse.json(
      { error: 'Failed to update warranty claim' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pool = await getPool();
    const claim_id = params.id;

    // Check if claim exists and is deletable (only pending claims can be deleted)
    const [claims] = await pool.execute<RowDataPacket[]>(
      `SELECT status FROM warranty_claims WHERE claim_id = ?`,
      [claim_id]
    );

    if (claims.length === 0) {
      return NextResponse.json(
        { error: 'Warranty claim not found' },
        { status: 404 }
      );
    }

    if (claims[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending claims can be deleted' },
        { status: 400 }
      );
    }

    // Delete claim photos first (foreign key constraint)
    await pool.execute(
      `DELETE FROM warranty_claim_photos WHERE claim_id = ?`,
      [claim_id]
    );

    // Delete the claim
    await pool.execute(
      `DELETE FROM warranty_claims WHERE claim_id = ?`,
      [claim_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Warranty claim deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting warranty claim:', error);
    return NextResponse.json(
      { error: 'Failed to delete warranty claim' },
      { status: 500 }
    );
  }
}