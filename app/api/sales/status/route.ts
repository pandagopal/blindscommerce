import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
};

// GET - Get sales staff online status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Verify user is sales staff
      const [salesStaffRows] = await connection.execute(
        'SELECT sales_staff_id FROM sales_staff WHERE user_id = ? AND is_active = 1',
        [session.user.id]
      );

      if (!Array.isArray(salesStaffRows) || salesStaffRows.length === 0) {
        return NextResponse.json({ 
          error: 'Only sales staff can access status information' 
        }, { status: 403 });
      }

      const salesStaffId = (salesStaffRows[0] as any).sales_staff_id;

      // Get current status
      const [statusRows] = await connection.execute(
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

      let status = null;
      if (Array.isArray(statusRows) && statusRows.length > 0) {
        const row = statusRows[0] as any;
        status = {
          isOnline: Boolean(row.is_online),
          isAvailableForAssistance: Boolean(row.is_available_for_assistance),
          currentActiveSessions: row.current_active_sessions || 0,
          maxConcurrentSessions: row.max_concurrent_sessions || 5,
          notificationPreferences: row.notification_preferences ? JSON.parse(row.notification_preferences) : {},
          lastActivity: row.last_activity
        };
      } else {
        // Create default status
        status = {
          isOnline: false,
          isAvailableForAssistance: false,
          currentActiveSessions: 0,
          maxConcurrentSessions: 5,
          notificationPreferences: {},
          lastActivity: null
        };
      }

      // Get current active assistance sessions
      const [activeSessionsRows] = await connection.execute(
        `SELECT 
          sas.*,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name
        FROM sales_assistance_sessions sas
        JOIN users u ON sas.customer_user_id = u.user_id
        WHERE sas.sales_staff_id = ? AND sas.status = 'active'
        ORDER BY sas.created_at DESC`,
        [salesStaffId]
      );

      return NextResponse.json({
        success: true,
        status,
        activeSessions: activeSessionsRows,
        salesStaffId
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Get sales status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status information' },
      { status: 500 }
    );
  }
}

// PUT - Update sales staff online status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      isOnline, 
      isAvailableForAssistance, 
      maxConcurrentSessions,
      notificationPreferences 
    } = await request.json();

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Verify user is sales staff
      const [salesStaffRows] = await connection.execute(
        'SELECT sales_staff_id FROM sales_staff WHERE user_id = ? AND is_active = 1',
        [session.user.id]
      );

      if (!Array.isArray(salesStaffRows) || salesStaffRows.length === 0) {
        return NextResponse.json({ 
          error: 'Only sales staff can update status' 
        }, { status: 403 });
      }

      const salesStaffId = (salesStaffRows[0] as any).sales_staff_id;

      // Update or create status
      await connection.execute(
        `INSERT INTO sales_staff_online_status (
          sales_staff_id,
          is_online,
          is_available_for_assistance,
          max_concurrent_sessions,
          notification_preferences,
          last_activity
        ) VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          is_online = VALUES(is_online),
          is_available_for_assistance = VALUES(is_available_for_assistance),
          max_concurrent_sessions = VALUES(max_concurrent_sessions),
          notification_preferences = VALUES(notification_preferences),
          last_activity = NOW(),
          updated_at = NOW()`,
        [
          salesStaffId,
          isOnline ? 1 : 0,
          isAvailableForAssistance ? 1 : 0,
          maxConcurrentSessions || 5,
          notificationPreferences ? JSON.stringify(notificationPreferences) : null
        ]
      );

      // If going offline, mark all pending assistance requests as expired
      if (!isOnline || !isAvailableForAssistance) {
        await connection.execute(
          `UPDATE sales_assistance_sessions 
          SET status = 'completed', completed_at = NOW()
          WHERE sales_staff_id = ? AND status = 'active'`,
          [salesStaffId]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Status updated successfully'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Update sales status error:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}