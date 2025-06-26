import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

// POST /api/account/shipping-addresses/[id]/default - Set address as default
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const addressId = parseInt(params.id);
    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: 'Invalid address ID' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    connection = await pool.getConnection();

    // Verify address belongs to user
    const [existingAddress] = await connection.execute<RowDataPacket[]>(
      'SELECT address_id, is_default FROM user_shipping_addresses WHERE address_id = ? AND user_id = ? AND is_active = TRUE',
      [addressId, user.userId]
    );

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Check if already default
    if ((existingAddress[0] as any).is_default) {
      return NextResponse.json({
        success: true,
        message: 'Address is already the default'
      });
    }

    await connection.beginTransaction();

    try {
      // Unset current default
      await connection.execute(
        'UPDATE user_shipping_addresses SET is_default = FALSE WHERE user_id = ? AND is_default = TRUE',
        [user.userId]
      );

      // Set new default
      await connection.execute(
        'UPDATE user_shipping_addresses SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP WHERE address_id = ?',
        [addressId]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({
        success: true,
        message: 'Default address updated successfully'
      });

    } catch (transactionError) {
      await connection.rollback();
      if (connection && connection.connection && !connection.connection.destroyed) {
        connection.release();
      }
      throw transactionError;
    }

  } catch (error) {
    console.error('Error setting default address:', error);
    if (connection && connection.connection && !connection.connection.destroyed) {
      connection.release();
    }
    return NextResponse.json(
      { error: 'Failed to set default address' },
      { status: 500 }
    );
  }
}