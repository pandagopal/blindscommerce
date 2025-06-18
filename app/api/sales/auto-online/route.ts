import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Automatically set sales staff online when they access the dashboard
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();

    try {
      // Check if user is sales staff
      const [salesStaffRows] = await pool.execute(
        'SELECT sales_staff_id FROM sales_staff WHERE user_id = ? AND is_active = 1',
        [user.userId]
      );

      if (!Array.isArray(salesStaffRows) || salesStaffRows.length === 0) {
        // Not a sales staff member, no action needed
        return NextResponse.json({ 
          success: true,
          message: 'User is not sales staff' 
        });
      }

      const salesStaffId = (salesStaffRows[0] as any).sales_staff_id;

      // Set online status
      await pool.execute(
        `INSERT INTO sales_staff_online_status (
          sales_staff_id,
          is_online,
          is_available_for_assistance,
          current_active_sessions,
          max_concurrent_sessions,
          last_activity
        ) VALUES (?, 1, 1, 0, 5, NOW())
        ON DUPLICATE KEY UPDATE
          is_online = 1,
          is_available_for_assistance = 1,
          last_activity = NOW(),
          updated_at = NOW()`,
        [salesStaffId]
      );

      // Get current status
      const [statusRows] = await pool.execute(
        `SELECT 
          is_online,
          is_available_for_assistance,
          current_active_sessions,
          max_concurrent_sessions,
          notification_preferences,
          last_activity
        FROM sales_staff_online_status 
        WHERE sales_staff_id = ?`,
        [salesStaffId]
      );

      const status = Array.isArray(statusRows) && statusRows.length > 0
        ? statusRows[0] as any
        : null;

      return NextResponse.json({
        success: true,
        message: 'Sales staff set online automatically',
        status: status ? {
          isOnline: Boolean(status.is_online),
          isAvailableForAssistance: Boolean(status.is_available_for_assistance),
          currentActiveSessions: status.current_active_sessions || 0,
          maxConcurrentSessions: status.max_concurrent_sessions || 5,
          notificationPreferences: status.notification_preferences ? JSON.parse(status.notification_preferences) : {},
          lastActivity: status.last_activity
        } : null
      });

    } finally {
      }

  } catch (error) {
    console.error('Auto online error:', error);
    return NextResponse.json(
      { error: 'Failed to set online status' },
      { status: 500 }
    );
  }
}