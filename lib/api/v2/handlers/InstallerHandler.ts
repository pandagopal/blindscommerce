/**
 * Installer Handler for V2 API
 * Handles installer-related endpoints (appointments, schedule, etc.)
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { RowDataPacket } from 'mysql2';

const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

export class InstallerHandler extends BaseHandler {
  /**
   * Handle GET requests
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes: Record<string, () => Promise<any>> = {
      'appointments': () => this.getAppointments(req, user),
      'appointments/:id': () => this.getAppointment(action[1], user),
      'schedule': () => this.getSchedule(req, user),
      'dashboard': () => this.getDashboard(user),
      'routes': () => this.getRoutes(req, user),
      'customers': () => this.getCustomers(req, user),
      'completed-jobs': () => this.getCompletedJobs(req, user),
      'reports': () => this.getReports(req, user),
      'pending-orders': () => this.getPendingOrders(req, user),
      'pending-orders/:id': () => this.getPendingOrderDetails(action[1], user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes: Record<string, () => Promise<any>> = {
      'pending-orders/:id/schedule': () => this.scheduleAppointmentForOrder(action[1], req, user),
      'pending-orders/:id/mark-diy': () => this.markOrderAsDIY(action[1], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PATCH requests
   */
  async handlePATCH(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes: Record<string, () => Promise<any>> = {
      'appointments/:id': () => this.updateAppointmentStatus(action[1], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Get installer user ID and verify installer role
   * Installers are users with role='installer' - no separate technician table needed
   */
  private getInstallerId(user: any): number {
    this.requireAuth(user);

    if (user.role !== 'installer') {
      throw new ApiError('Access denied. Installer role required.', 403);
    }

    return user.userId;
  }

  /**
   * Get appointments for the logged-in installer
   */
  private async getAppointments(req: NextRequest, user: any) {
    const installerId = this.getInstallerId(user);

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let query = `
      SELECT
        ia.appointment_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        COALESCE(ua.address_line1, '') as address,
        DATE_FORMAT(ia.appointment_date, '%Y-%m-%d') as date,
        CONCAT(its.start_time, ' - ', its.end_time) as time,
        ia.status,
        ia.installation_type as type,
        u.phone,
        ia.special_requirements as notes
      FROM installation_appointments ia
      LEFT JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
      WHERE ia.assigned_technician_id = ?
    `;

    const params: (number | string)[] = [installerId];

    if (status && status !== 'all') {
      query += ' AND ia.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND ia.appointment_date = ?';
      params.push(date);
    }

    query += ' ORDER BY ia.appointment_date ASC, its.start_time ASC';

    const [appointments] = await pool.execute<RowDataPacket[]>(query, params);

    // Map status values to frontend format
    const mappedAppointments = (appointments || []).map(apt => ({
      ...apt,
      status: this.mapStatusToFrontend(apt.status),
      type: apt.type || 'installation',
    }));

    return mappedAppointments;
  }

  /**
   * Get single appointment details
   */
  private async getAppointment(appointmentId: string, user: any) {
    const installerId = this.getInstallerId(user);
    const pool = await getPool();

    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      throw new ApiError('Invalid appointment ID', 400);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        ia.appointment_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        COALESCE(ua.address_line1, '') as address,
        COALESCE(ua.city, '') as city,
        COALESCE(ua.state_province, '') as state,
        COALESCE(ua.postal_code, '') as postalCode,
        DATE_FORMAT(ia.appointment_date, '%Y-%m-%d') as date,
        CONCAT(its.start_time, ' - ', its.end_time) as time,
        ia.status,
        ia.installation_type as type,
        u.phone,
        u.email,
        ia.special_requirements as notes,
        ia.completion_notes as technician_notes,
        o.order_id,
        o.order_number
      FROM installation_appointments ia
      LEFT JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
      LEFT JOIN orders o ON ia.order_id = o.order_id
      WHERE ia.appointment_id = ? AND ia.assigned_technician_id = ?`,
      [id, installerId]
    );

    if (!rows || rows.length === 0) {
      throw new ApiError('Appointment not found', 404);
    }

    const appointment = rows[0];
    return {
      ...appointment,
      status: this.mapStatusToFrontend(appointment.status),
      type: appointment.type || 'installation',
    };
  }

  /**
   * Get installer's schedule
   */
  private async getSchedule(req: NextRequest, user: any) {
    const installerId = this.getInstallerId(user);
    const pool = await getPool();
    const searchParams = this.getSearchParams(req);

    // Default to next 7 days
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDateParam = searchParams.get('endDate');
    const endDate = endDateParam || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })();

    const [appointments] = await pool.execute<RowDataPacket[]>(
      `SELECT
        ia.appointment_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        DATE_FORMAT(ia.appointment_date, '%Y-%m-%d') as date,
        CONCAT(its.start_time, ' - ', its.end_time) as time,
        ia.status,
        ia.installation_type as type
      FROM installation_appointments ia
      LEFT JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
      WHERE ia.assigned_technician_id = ?
        AND ia.appointment_date BETWEEN ? AND ?
        AND ia.status != 'cancelled'
      ORDER BY ia.appointment_date ASC, its.start_time ASC`,
      [installerId, startDate, endDate]
    );

    return {
      schedule: (appointments || []).map(apt => ({
        ...apt,
        status: this.mapStatusToFrontend(apt.status),
        type: apt.type || 'installation',
      })),
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Get installer dashboard data
   */
  private async getDashboard(user: any) {
    const installerId = this.getInstallerId(user);
    const pool = await getPool();
    const today = new Date().toISOString().split('T')[0];

    // Get today's appointments
    const [todayAppointments] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM installation_appointments
       WHERE assigned_technician_id = ? AND appointment_date = ? AND status != 'cancelled'`,
      [installerId, today]
    );

    // Get pending appointments
    const [pendingAppointments] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM installation_appointments
       WHERE assigned_technician_id = ? AND status = 'scheduled' AND appointment_date >= ?`,
      [installerId, today]
    );

    // Get completed this month
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    const [completedThisMonth] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM installation_appointments
       WHERE assigned_technician_id = ? AND status = 'completed'
       AND appointment_date >= ?`,
      [installerId, firstOfMonth.toISOString().split('T')[0]]
    );

    // Calculate total installations for this installer
    const [totalStats] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total_installations FROM installation_appointments
       WHERE assigned_technician_id = ? AND status = 'completed'`,
      [installerId]
    );

    return {
      todayCount: todayAppointments[0]?.count || 0,
      pendingCount: pendingAppointments[0]?.count || 0,
      completedThisMonth: completedThisMonth[0]?.count || 0,
      averageRating: 0, // Could be calculated from reviews if needed
      totalInstallations: totalStats[0]?.total_installations || 0,
    };
  }

  /**
   * Update appointment status
   */
  private async updateAppointmentStatus(appointmentId: string, req: NextRequest, user: any) {
    const installerId = this.getInstallerId(user);
    const pool = await getPool();

    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      throw new ApiError('Invalid appointment ID', 400);
    }

    const data = await this.getValidatedBody(req, UpdateAppointmentStatusSchema);

    // Verify appointment belongs to this installer
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT appointment_id FROM installation_appointments WHERE appointment_id = ? AND assigned_technician_id = ?',
      [id, installerId]
    );

    if (!existing || existing.length === 0) {
      throw new ApiError('Appointment not found', 404);
    }

    // Map frontend status to database status
    const dbStatus = this.mapStatusToDatabase(data.status);

    // Update the appointment
    const updates: string[] = ['status = ?'];
    const values: (string | number)[] = [dbStatus];

    if (data.notes) {
      updates.push('completion_notes = ?');
      values.push(data.notes);
    }

    if (data.status === 'completed') {
      updates.push('completed_at = NOW()');
    }

    values.push(id);

    await pool.execute(
      `UPDATE installation_appointments SET ${updates.join(', ')}, updated_at = NOW() WHERE appointment_id = ?`,
      values
    );

    return {
      success: true,
      message: 'Appointment status updated',
      appointmentId: id,
      status: data.status,
    };
  }

  /**
   * Map database status to frontend format
   */
  private mapStatusToFrontend(dbStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'scheduled',
      'scheduled': 'scheduled',
      'confirmed': 'scheduled',
      'in_progress': 'in-progress',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'rescheduled': 'scheduled',
    };
    return statusMap[dbStatus?.toLowerCase()] || 'scheduled';
  }

  /**
   * Map frontend status to database format
   */
  private mapStatusToDatabase(frontendStatus: string): string {
    const statusMap: Record<string, string> = {
      'scheduled': 'scheduled',
      'in-progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
    };
    return statusMap[frontendStatus] || 'scheduled';
  }

  /**
   * Get daily routes for the installer
   * Groups appointments by date to create optimized route plans
   */
  private async getRoutes(req: NextRequest, user: any) {
    const installerId = this.getInstallerId(user);
    const pool = await getPool();
    const searchParams = this.getSearchParams(req);

    // Default to upcoming 7 days
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDateParam = searchParams.get('endDate');
    const endDate = endDateParam || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })();

    // Get appointments grouped by date
    const [appointments] = await pool.execute<RowDataPacket[]>(
      `SELECT
        ia.appointment_id,
        DATE_FORMAT(ia.appointment_date, '%Y-%m-%d') as date,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        COALESCE(ua.address_line1, '') as address,
        COALESCE(ua.city, '') as city,
        COALESCE(ua.state_province, '') as state,
        COALESCE(ua.postal_code, '') as postal_code,
        its.start_time as appointment_time,
        ia.installation_type as type,
        ia.status,
        ia.special_requirements as notes,
        COALESCE(ia.estimated_duration_hours * 60, 60) as estimated_duration
      FROM installation_appointments ia
      LEFT JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
      WHERE ia.assigned_technician_id = ?
        AND ia.appointment_date BETWEEN ? AND ?
        AND ia.status != 'cancelled'
      ORDER BY ia.appointment_date ASC, its.start_time ASC`,
      [installerId, startDate, endDate]
    );

    // Group appointments by date into routes
    const routesByDate: Record<string, any> = {};

    for (const apt of appointments) {
      const date = apt.date;
      if (!routesByDate[date]) {
        routesByDate[date] = {
          id: `route-${date}`,
          date: date,
          total_stops: 0,
          estimated_duration: 0,
          total_distance: 0, // Would need a maps API to calculate actual distance
          status: 'planned',
          stops: [],
        };
      }

      const route = routesByDate[date];
      const fullAddress = [apt.address, apt.city, apt.state, apt.postal_code]
        .filter(Boolean)
        .join(', ');

      route.stops.push({
        id: apt.appointment_id.toString(),
        customerName: apt.customerName,
        address: fullAddress || 'Address not available',
        appointment_time: apt.appointment_time || '09:00:00',
        type: apt.type || 'installation',
        estimated_duration: apt.estimated_duration,
        status: this.mapStatusToRouteStop(apt.status),
        notes: apt.notes || '',
      });

      route.total_stops++;
      route.estimated_duration += apt.estimated_duration;

      // Update route status based on appointments
      if (route.stops.some((s: any) => s.status === 'completed') &&
          route.stops.some((s: any) => s.status === 'pending')) {
        route.status = 'in_progress';
      } else if (route.stops.every((s: any) => s.status === 'completed')) {
        route.status = 'completed';
      }
    }

    return Object.values(routesByDate);
  }

  /**
   * Map appointment status to route stop status
   */
  private mapStatusToRouteStop(status: string): string {
    const statusMap: Record<string, string> = {
      'scheduled': 'pending',
      'pending': 'pending',
      'confirmed': 'pending',
      'in_progress': 'pending',
      'completed': 'completed',
      'cancelled': 'skipped',
      'rescheduled': 'skipped',
    };
    return statusMap[status?.toLowerCase()] || 'pending';
  }

  /**
   * Get customers for the installer (from their appointments)
   */
  private async getCustomers(req: NextRequest, user: any) {
    const installerId = this.getInstallerId(user);
    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const search = searchParams.get('search') || '';

    let query = `
      SELECT DISTINCT
        u.user_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        COALESCE(ua.address_line1, '') as address,
        COALESCE(ua.city, '') as city,
        COALESCE(ua.state_province, '') as state,
        COALESCE(ua.postal_code, '') as postalCode,
        COUNT(ia.appointment_id) as totalAppointments,
        MAX(ia.appointment_date) as lastAppointment
      FROM installation_appointments ia
      INNER JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
      WHERE ia.assigned_technician_id = ?
    `;

    const params: (number | string)[] = [installerId];

    if (search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.phone, ua.address_line1, ua.city, ua.state_province, ua.postal_code`;
    query += ` ORDER BY lastAppointment DESC`;

    const [customers] = await pool.execute<RowDataPacket[]>(query, params);

    return customers || [];
  }

  /**
   * Get completed jobs for the installer
   */
  private async getCompletedJobs(req: NextRequest, user: any) {
    const installerId = this.getInstallerId(user);
    const pool = await getPool();
    const searchParams = this.getSearchParams(req);

    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use string interpolation for LIMIT/OFFSET to avoid mysql2 type issues
    const [jobs] = await pool.execute<RowDataPacket[]>(
      `SELECT
        ia.appointment_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        COALESCE(ua.address_line1, '') as address,
        COALESCE(ua.city, '') as city,
        COALESCE(ua.state_province, '') as state,
        DATE_FORMAT(ia.appointment_date, '%Y-%m-%d') as date,
        DATE_FORMAT(ia.completed_at, '%Y-%m-%d %H:%i') as completedAt,
        ia.installation_type as type,
        ia.completion_notes as notes,
        ia.customer_rating as rating,
        ia.customer_feedback as feedback,
        o.order_number
      FROM installation_appointments ia
      LEFT JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN orders o ON ia.order_id = o.order_id
      WHERE ia.assigned_technician_id = ?
        AND ia.status = 'completed'
      ORDER BY ia.completed_at DESC
      LIMIT ${limit} OFFSET ${offset}`,
      [installerId]
    );

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM installation_appointments
       WHERE assigned_technician_id = ? AND status = 'completed'`,
      [installerId]
    );

    return {
      jobs: jobs || [],
      total: countResult[0]?.total || 0,
      limit,
      offset
    };
  }

  /**
   * Get reports data for the installer
   */
  private async getReports(req: NextRequest, user: any) {
    const installerId = this.getInstallerId(user);
    const pool = await getPool();
    const searchParams = this.getSearchParams(req);

    // Calculate date range based on parameter
    const dateRangeParam = searchParams.get('dateRange') || '30d';
    const endDate = new Date();
    const startDate = new Date();

    switch (dateRangeParam) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get performance metrics
    const [performanceRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
        AVG(customer_rating) as avg_rating,
        AVG(TIMESTAMPDIFF(MINUTE, started_at, completed_at)) as avg_completion_time
      FROM installation_appointments
      WHERE assigned_technician_id = ?
        AND appointment_date BETWEEN ? AND ?`,
      [installerId, startDateStr, endDateStr]
    );

    // Get on-time percentage (appointments completed within estimated duration)
    const [onTimeRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, started_at, completed_at) <= estimated_duration_hours * 60 THEN 1 ELSE 0 END) as on_time
      FROM installation_appointments
      WHERE assigned_technician_id = ?
        AND appointment_date BETWEEN ? AND ?
        AND status = 'completed'
        AND started_at IS NOT NULL
        AND completed_at IS NOT NULL`,
      [installerId, startDateStr, endDateStr]
    );

    // Get repeat customers count
    const [repeatCustomers] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT customer_id) as repeat_customers
      FROM installation_appointments
      WHERE assigned_technician_id = ?
        AND customer_id IN (
          SELECT customer_id FROM installation_appointments
          WHERE assigned_technician_id = ?
          GROUP BY customer_id
          HAVING COUNT(*) > 1
        )`,
      [installerId, installerId]
    );

    // Get revenue data (using total_cost from appointments)
    const [revenueRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        SUM(total_cost) as total_revenue,
        AVG(total_cost) as avg_job_value
      FROM installation_appointments
      WHERE assigned_technician_id = ?
        AND appointment_date BETWEEN ? AND ?
        AND status = 'completed'`,
      [installerId, startDateStr, endDateStr]
    );

    // Get revenue by type
    const [revenueByType] = await pool.execute<RowDataPacket[]>(
      `SELECT
        installation_type as type,
        SUM(total_cost) as revenue
      FROM installation_appointments
      WHERE assigned_technician_id = ?
        AND appointment_date BETWEEN ? AND ?
        AND status = 'completed'
      GROUP BY installation_type`,
      [installerId, startDateStr, endDateStr]
    );

    // Get jobs per day (productivity)
    const [productivityRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) / DATEDIFF(?, ?) as jobs_per_day
      FROM installation_appointments
      WHERE assigned_technician_id = ?
        AND appointment_date BETWEEN ? AND ?
        AND status = 'completed'`,
      [endDateStr, startDateStr, installerId, startDateStr, endDateStr]
    );

    // Get most productive day
    const [mostProductiveDay] = await pool.execute<RowDataPacket[]>(
      `SELECT
        DAYNAME(appointment_date) as day_name,
        COUNT(*) as job_count
      FROM installation_appointments
      WHERE assigned_technician_id = ?
        AND appointment_date BETWEEN ? AND ?
        AND status = 'completed'
      GROUP BY DAYNAME(appointment_date)
      ORDER BY job_count DESC
      LIMIT 1`,
      [installerId, startDateStr, endDateStr]
    );

    // Get rating distribution
    const [ratingDist] = await pool.execute<RowDataPacket[]>(
      `SELECT
        customer_rating as rating,
        COUNT(*) as count
      FROM installation_appointments
      WHERE assigned_technician_id = ?
        AND appointment_date BETWEEN ? AND ?
        AND customer_rating IS NOT NULL
      GROUP BY customer_rating`,
      [installerId, startDateStr, endDateStr]
    );

    // Get recent feedback
    const [feedback] = await pool.execute<RowDataPacket[]>(
      `SELECT customer_feedback
      FROM installation_appointments
      WHERE assigned_technician_id = ?
        AND appointment_date BETWEEN ? AND ?
        AND customer_feedback IS NOT NULL
        AND customer_feedback != ''
      ORDER BY completed_at DESC
      LIMIT 5`,
      [installerId, startDateStr, endDateStr]
    );

    const perf = performanceRows[0] || {};
    const onTime = onTimeRows[0] || {};
    const rev = revenueRows[0] || {};
    const prod = productivityRows[0] || {};

    // Build rating distribution object
    const ratingDistribution: { [key: number]: number } = {};
    for (const r of ratingDist) {
      ratingDistribution[r.rating] = r.count;
    }

    // Build revenue by type object
    const revenueByTypeObj: { [key: string]: number } = {};
    for (const r of revenueByType) {
      revenueByTypeObj[r.type || 'installation'] = parseFloat(r.revenue) || 0;
    }

    return {
      performance: {
        total_jobs: perf.total_jobs || 0,
        completed_jobs: perf.completed_jobs || 0,
        avg_rating: parseFloat(perf.avg_rating) || 0,
        avg_completion_time: Math.round(perf.avg_completion_time) || 0,
        on_time_percentage: onTime.total > 0 ? Math.round((onTime.on_time / onTime.total) * 100) : 0,
        repeat_customers: repeatCustomers[0]?.repeat_customers || 0,
      },
      revenue: {
        total_revenue: parseFloat(rev.total_revenue) || 0,
        avg_job_value: parseFloat(rev.avg_job_value) || 0,
        monthly_revenue: [], // Would need separate monthly calculation
        revenue_by_type: revenueByTypeObj,
      },
      productivity: {
        jobs_per_day: parseFloat(prod.jobs_per_day) || 0,
        utilization_rate: 0, // Would need schedule data to calculate
        travel_time_percentage: 0, // Would need GPS/travel data
        most_productive_day: mostProductiveDay[0]?.day_name || 'N/A',
      },
      customer_satisfaction: {
        avg_rating: parseFloat(perf.avg_rating) || 0,
        rating_distribution: ratingDistribution,
        feedback_summary: feedback.map(f => f.customer_feedback),
      },
    };
  }

  // =====================================================
  // Pending Orders Management (Shipped orders needing installation)
  // =====================================================

  /**
   * Get installer_id from installers table for this user
   */
  private async getInstallerRecordId(userId: number): Promise<number | null> {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT installer_id FROM installers WHERE user_id = ? AND is_active = 1 LIMIT 1`,
      [userId]
    );
    return rows.length > 0 ? rows[0].installer_id : null;
  }

  /**
   * Get technician_id from installation_technicians table for this user
   * This is needed for creating appointments (FK constraint)
   */
  private async getTechnicianId(userId: number): Promise<number | null> {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT technician_id FROM installation_technicians WHERE user_id = ? AND is_active = 1 LIMIT 1`,
      [userId]
    );
    return rows.length > 0 ? rows[0].technician_id : null;
  }

  /**
   * Get zip codes served by the installer
   */
  private async getInstallerServiceZipCodes(installerId: number): Promise<string[]> {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT zip_code FROM installer_zip_codes WHERE installer_id = ? AND is_active = 1`,
      [installerId]
    );
    return rows.map(r => r.zip_code);
  }

  /**
   * Get shipped orders in installer's service area that need scheduling
   * These are orders:
   * - In "shipped" status (not "diy")
   * - Shipped at least 7 days ago (ready for installation)
   * - Shipping address zip code matches installer's service area
   * - No installation appointment scheduled yet
   */
  private async getPendingOrders(req: NextRequest, user: any) {
    const userId = this.getInstallerId(user);
    const pool = await getPool();
    const searchParams = this.getSearchParams(req);

    // Get installer record from installers table
    const installerId = await this.getInstallerRecordId(userId);
    if (!installerId) {
      throw new ApiError('Installer profile not found. Please contact admin.', 400);
    }

    // Get service zip codes
    const zipCodes = await this.getInstallerServiceZipCodes(installerId);
    if (zipCodes.length === 0) {
      return { orders: [], message: 'No service areas configured. Please contact admin to set up your service zip codes.' };
    }

    const filter = searchParams.get('filter') || 'pending'; // pending, diy, all
    const search = searchParams.get('search') || '';

    // Build query for orders in service area
    const zipPlaceholders = zipCodes.map(() => '?').join(',');

    let statusCondition = '';
    if (filter === 'pending') {
      statusCondition = `AND o.status = 'shipped'`;
    } else if (filter === 'diy') {
      statusCondition = `AND o.status = 'diy'`;
    } else {
      statusCondition = `AND o.status IN ('shipped', 'diy')`;
    }

    let query = `
      SELECT
        o.order_id,
        o.order_number,
        o.status,
        o.total_amount,
        o.shipped_at,
        DATE_ADD(o.shipped_at, INTERVAL 7 DAY) as ready_for_installation_date,
        DATEDIFF(NOW(), o.shipped_at) as days_since_shipped,
        u.user_id as customer_id,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        usa.address_line_1,
        usa.address_line_2,
        usa.city,
        usa.state_province,
        usa.postal_code,
        usa.country,
        (SELECT COUNT(*) FROM installation_appointments ia WHERE ia.order_id = o.order_id) as has_appointment
      FROM orders o
      INNER JOIN users u ON o.user_id = u.user_id
      INNER JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
      WHERE usa.postal_code IN (${zipPlaceholders})
        ${statusCondition}
        AND o.shipped_at IS NOT NULL
        AND o.shipped_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;

    const params: any[] = [...zipCodes];

    if (search) {
      query += ` AND (o.order_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY o.shipped_at ASC`; // Oldest first

    const [orders] = await pool.execute<RowDataPacket[]>(query, params);

    // Filter out orders that already have appointments (for pending filter)
    const filteredOrders = filter === 'pending'
      ? (orders as any[]).filter(o => o.has_appointment === 0)
      : orders;

    return {
      orders: filteredOrders.map(o => ({
        order_id: o.order_id,
        order_number: o.order_number,
        status: o.status,
        total_amount: parseFloat(o.total_amount),
        shipped_at: o.shipped_at,
        ready_for_installation_date: o.ready_for_installation_date,
        days_since_shipped: o.days_since_shipped,
        has_appointment: o.has_appointment > 0,
        customer: {
          id: o.customer_id,
          name: o.customer_name,
          email: o.customer_email,
          phone: o.customer_phone
        },
        shipping_address: {
          address_line1: o.address_line_1,
          address_line2: o.address_line_2,
          city: o.city,
          state: o.state_province,
          postal_code: o.postal_code,
          country: o.country
        }
      })),
      service_zip_codes: zipCodes,
      installer_id: installerId
    };
  }

  /**
   * Get detailed information about a specific pending order
   */
  private async getPendingOrderDetails(orderId: string, user: any) {
    const userId = this.getInstallerId(user);
    const pool = await getPool();

    const id = parseInt(orderId);
    if (isNaN(id)) {
      throw new ApiError('Invalid order ID', 400);
    }

    // Get installer record and verify order is in their service area
    const installerId = await this.getInstallerRecordId(userId);
    if (!installerId) {
      throw new ApiError('Installer profile not found', 400);
    }

    const zipCodes = await this.getInstallerServiceZipCodes(installerId);
    const zipPlaceholders = zipCodes.map(() => '?').join(',');

    const [orders] = await pool.execute<RowDataPacket[]>(
      `SELECT
        o.*,
        u.user_id as customer_id,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        usa.address_line_1,
        usa.address_line_2,
        usa.city,
        usa.state_province,
        usa.postal_code,
        usa.country
      FROM orders o
      INNER JOIN users u ON o.user_id = u.user_id
      INNER JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
      WHERE o.order_id = ?
        AND usa.postal_code IN (${zipPlaceholders})`,
      [id, ...zipCodes]
    );

    if (!(orders as any[]).length) {
      throw new ApiError('Order not found or not in your service area', 404);
    }

    const order = (orders as any[])[0];

    // Get order items
    const [items] = await pool.execute<RowDataPacket[]>(
      `SELECT
        oi.*,
        p.product_name,
        p.sku
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?`,
      [id]
    );

    // Check if appointment exists
    const [appointments] = await pool.execute<RowDataPacket[]>(
      `SELECT
        ia.*,
        its.slot_name,
        CONCAT(its.start_time, ' - ', its.end_time) as time_range
      FROM installation_appointments ia
      LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
      WHERE ia.order_id = ?`,
      [id]
    );

    return {
      order: {
        order_id: order.order_id,
        order_number: order.order_number,
        status: order.status,
        total_amount: parseFloat(order.total_amount),
        subtotal: parseFloat(order.subtotal),
        tax_amount: parseFloat(order.tax_amount),
        shipping_amount: parseFloat(order.shipping_amount),
        created_at: order.created_at,
        shipped_at: order.shipped_at,
        notes: order.notes
      },
      customer: {
        id: order.customer_id,
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone
      },
      shipping_address: {
        address_line1: order.address_line_1,
        address_line2: order.address_line_2,
        city: order.city,
        state: order.state_province,
        postal_code: order.postal_code,
        country: order.country
      },
      items: items,
      appointment: appointments.length > 0 ? appointments[0] : null
    };
  }

  /**
   * Schedule an installation appointment for an order
   * Called by installer after contacting customer
   */
  private async scheduleAppointmentForOrder(orderId: string, req: NextRequest, user: any) {
    const userId = this.getInstallerId(user);
    const pool = await getPool();

    const id = parseInt(orderId);
    if (isNaN(id)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const body = await req.json();
    const {
      appointment_date,
      time_slot_id,
      installation_type = 'installation',
      special_requirements,
      estimated_duration_hours = 2
    } = body;

    if (!appointment_date) throw new ApiError('appointment_date is required', 400);
    if (!time_slot_id) throw new ApiError('time_slot_id is required', 400);

    // Get installer record (for zip code lookup)
    const installerId = await this.getInstallerRecordId(userId);
    if (!installerId) {
      throw new ApiError('Installer profile not found', 400);
    }

    // Get technician_id (for appointment FK constraint)
    const technicianId = await this.getTechnicianId(userId);
    if (!technicianId) {
      throw new ApiError('Technician profile not found. Please contact admin.', 400);
    }

    // Verify order exists and is in service area
    const zipCodes = await this.getInstallerServiceZipCodes(installerId);
    const zipPlaceholders = zipCodes.map(() => '?').join(',');

    const [orders] = await pool.execute<RowDataPacket[]>(
      `SELECT o.order_id, o.order_number, o.user_id, o.status, o.shipped_at,
         usa.postal_code, usa.address_line_1, usa.address_line_2, usa.city,
         usa.state_province, usa.country, usa.phone as address_phone,
         u.phone as customer_phone
       FROM orders o
       INNER JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
       INNER JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = ?
         AND usa.postal_code IN (${zipPlaceholders})
         AND o.status IN ('shipped', 'diy')`,
      [id, ...zipCodes]
    );

    if (!(orders as any[]).length) {
      throw new ApiError('Order not found, not in your service area, or not eligible for scheduling', 404);
    }

    const order = (orders as any[])[0];

    // Validate appointment date is at least 7 days after shipment
    if (order.shipped_at) {
      const shippedDate = new Date(order.shipped_at);
      const appointmentDateObj = new Date(appointment_date);
      const minDate = new Date(shippedDate);
      minDate.setDate(minDate.getDate() + 7);

      if (appointmentDateObj < minDate) {
        throw new ApiError(
          `Appointment must be at least 7 days after shipment. Earliest: ${minDate.toISOString().split('T')[0]}`,
          400
        );
      }
    }

    // Verify time slot exists
    const [timeSlots] = await pool.execute<RowDataPacket[]>(
      `SELECT slot_id FROM installation_time_slots WHERE slot_id = ? AND is_active = 1`,
      [time_slot_id]
    );

    if (!(timeSlots as any[]).length) {
      throw new ApiError('Invalid time slot', 400);
    }

    // Check if appointment already exists
    const [existingAppointment] = await pool.execute<RowDataPacket[]>(
      `SELECT appointment_id FROM installation_appointments WHERE order_id = ?`,
      [id]
    );

    if ((existingAppointment as any[]).length) {
      throw new ApiError('An appointment already exists for this order', 400);
    }

    // Build installation address JSON
    const installationAddress = JSON.stringify({
      address_line_1: order.address_line_1,
      address_line_2: order.address_line_2 || '',
      city: order.city,
      state: order.state_province,
      postal_code: order.postal_code,
      country: order.country || 'USA'
    });

    // Contact phone - use address phone or customer phone
    const contactPhone = order.address_phone || order.customer_phone || '';

    // Create the appointment (assigned_technician_id references installation_technicians.technician_id)
    const [result] = await pool.execute(
      `INSERT INTO installation_appointments (
        customer_id,
        order_id,
        assigned_technician_id,
        appointment_date,
        time_slot_id,
        installation_type,
        product_types,
        special_requirements,
        estimated_duration_hours,
        installation_address,
        contact_phone,
        base_cost,
        total_cost,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW())`,
      [
        order.user_id,
        id,
        technicianId, // Use technician_id from installation_technicians table
        appointment_date,
        time_slot_id,
        installation_type,
        JSON.stringify(['blinds']), // Default product types
        special_requirements || null,
        estimated_duration_hours,
        installationAddress,
        contactPhone,
        0.00, // base_cost - can be updated later
        0.00  // total_cost - can be updated later
      ]
    );

    const appointmentId = (result as any).insertId;

    // Update order status if it was DIY (customer changed their mind)
    if (order.status === 'diy') {
      await pool.execute(
        `UPDATE orders SET status = 'shipped', updated_at = NOW() WHERE order_id = ?`,
        [id]
      );
    }

    return {
      success: true,
      appointment_id: appointmentId,
      message: 'Installation appointment scheduled successfully',
      order_number: order.order_number
    };
  }

  /**
   * Mark an order as DIY (customer declined installation)
   */
  private async markOrderAsDIY(orderId: string, req: NextRequest, user: any) {
    const userId = this.getInstallerId(user);
    const pool = await getPool();

    const id = parseInt(orderId);
    if (isNaN(id)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const body = await req.json();
    const { reason } = body;

    // Get installer record
    const installerId = await this.getInstallerRecordId(userId);
    if (!installerId) {
      throw new ApiError('Installer profile not found', 400);
    }

    // Verify order exists and is in service area
    const zipCodes = await this.getInstallerServiceZipCodes(installerId);
    const zipPlaceholders = zipCodes.map(() => '?').join(',');

    const [orders] = await pool.execute<RowDataPacket[]>(
      `SELECT o.order_id, o.order_number, o.status
       FROM orders o
       INNER JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
       WHERE o.order_id = ?
         AND usa.postal_code IN (${zipPlaceholders})
         AND o.status = 'shipped'`,
      [id, ...zipCodes]
    );

    if (!(orders as any[]).length) {
      throw new ApiError('Order not found, not in your service area, or not eligible', 404);
    }

    const order = (orders as any[])[0];

    // Update order status to DIY
    await pool.execute(
      `UPDATE orders SET
        status = 'diy',
        notes = CONCAT(COALESCE(notes, ''), '\n[DIY] Customer declined installation. Reason: ', ?),
        updated_at = NOW()
       WHERE order_id = ?`,
      [reason || 'No reason provided', id]
    );

    return {
      success: true,
      message: 'Order marked as DIY (self-installation)',
      order_number: order.order_number
    };
  }
}
