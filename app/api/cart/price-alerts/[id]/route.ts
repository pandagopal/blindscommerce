import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// DELETE - Remove price alert
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const alert_id = parseInt(params.id);
    const pool = await getPool();

    // Verify alert belongs to user
    const [alerts] = await pool.execute(
      'SELECT alert_id FROM price_alerts WHERE alert_id = ? AND user_id = ?',
      [alert_id, user.userId]
    );

    if (!alerts || (alerts as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Price alert not found' },
        { status: 404 }
      );
    }

    // Delete price alert
    await pool.execute(
      'DELETE FROM price_alerts WHERE alert_id = ?',
      [alert_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Price alert removed successfully'
    });

  } catch (error) {
    console.error('Delete price alert error:', error);
    return NextResponse.json(
      { error: 'Failed to remove price alert' },
      { status: 500 }
    );
  }
}

// PATCH - Update price alert
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const alert_id = parseInt(params.id);
    const updateData = await request.json();
    const pool = await getPool();

    // Verify alert belongs to user
    const [alerts] = await pool.execute(
      'SELECT * FROM price_alerts WHERE alert_id = ? AND user_id = ?',
      [alert_id, user.userId]
    );

    if (!alerts || (alerts as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Price alert not found' },
        { status: 404 }
      );
    }

    const alert = (alerts as any[])[0];

    // Build update query
    const updates = [];
    const values = [];

    if (updateData.target_price !== undefined) {
      updates.push('target_price = ?');
      values.push(updateData.target_price);
    }
    if (updateData.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(updateData.is_active);
    }
    if (updateData.alert_type !== undefined) {
      updates.push('alert_type = ?');
      values.push(updateData.alert_type);
    }

    if (updates.length > 0) {
      values.push(alert_id);
      
      await pool.execute(`
        UPDATE price_alerts 
        SET ${updates.join(', ')}
        WHERE alert_id = ?
      `, values);
    }

    // Get updated alert
    const [updatedAlert] = await pool.execute(`
      SELECT 
        pa.*,
        p.name as product_name,
        p.price as current_price,
        p.slug as product_slug
      FROM price_alerts pa
      JOIN products p ON pa.product_id = p.product_id
      WHERE pa.alert_id = ?
    `, [alert_id]);

    return NextResponse.json({
      success: true,
      message: 'Price alert updated successfully',
      alert: (updatedAlert as any[])[0]
    });

  } catch (error) {
    console.error('Update price alert error:', error);
    return NextResponse.json(
      { error: 'Failed to update price alert' },
      { status: 500 }
    );
  }
}