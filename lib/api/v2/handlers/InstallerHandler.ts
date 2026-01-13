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
   * Get technician ID for the current user
   * Returns null if technician profile doesn't exist
   */
  private async getTechnicianId(user: any, throwIfNotFound: boolean = true): Promise<number | null> {
    this.requireAuth(user);

    if (user.role !== 'installer') {
      throw new ApiError('Access denied. Installer role required.', 403);
    }

    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT technician_id FROM installation_technicians WHERE user_id = ? AND is_active = 1',
      [user.userId]
    );

    if (!rows || rows.length === 0) {
      if (throwIfNotFound) {
        throw new ApiError(
          'Technician profile not found. Please contact an administrator to set up your installer profile.',
          404,
          'TECHNICIAN_PROFILE_MISSING'
        );
      }
      return null;
    }

    return rows[0].technician_id;
  }

  /**
   * Get appointments for the logged-in installer
   */
  private async getAppointments(req: NextRequest, user: any) {
    const technicianId = await this.getTechnicianId(user, false);

    // If no technician profile, return empty list with setup message
    if (!technicianId) {
      return {
        appointments: [],
        message: 'Your installer profile is not set up yet. Please contact an administrator.',
        profileMissing: true,
      };
    }

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let query = `
      SELECT
        ia.appointment_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        COALESCE(ua.street_address, '') as address,
        DATE_FORMAT(ia.appointment_date, '%Y-%m-%d') as date,
        CONCAT(its.start_time, ' - ', its.end_time) as time,
        ia.status,
        ia.appointment_type as type,
        u.phone,
        ia.customer_notes as notes
      FROM installation_appointments ia
      LEFT JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
      WHERE ia.assigned_technician_id = ?
    `;

    const params: (number | string)[] = [technicianId];

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
    const technicianId = await this.getTechnicianId(user);
    const pool = await getPool();

    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      throw new ApiError('Invalid appointment ID', 400);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        ia.appointment_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        COALESCE(ua.street_address, '') as address,
        COALESCE(ua.city, '') as city,
        COALESCE(ua.state, '') as state,
        COALESCE(ua.postal_code, '') as postalCode,
        DATE_FORMAT(ia.appointment_date, '%Y-%m-%d') as date,
        CONCAT(its.start_time, ' - ', its.end_time) as time,
        ia.status,
        ia.appointment_type as type,
        u.phone,
        u.email,
        ia.customer_notes as notes,
        ia.technician_notes,
        o.order_id,
        o.order_number
      FROM installation_appointments ia
      LEFT JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
      LEFT JOIN orders o ON ia.order_id = o.order_id
      WHERE ia.appointment_id = ? AND ia.assigned_technician_id = ?`,
      [id, technicianId]
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
    const technicianId = await this.getTechnicianId(user);
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
        ia.appointment_type as type
      FROM installation_appointments ia
      LEFT JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
      WHERE ia.assigned_technician_id = ?
        AND ia.appointment_date BETWEEN ? AND ?
        AND ia.status != 'cancelled'
      ORDER BY ia.appointment_date ASC, its.start_time ASC`,
      [technicianId, startDate, endDate]
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
    const technicianId = await this.getTechnicianId(user);
    const pool = await getPool();
    const today = new Date().toISOString().split('T')[0];

    // Get today's appointments
    const [todayAppointments] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM installation_appointments
       WHERE assigned_technician_id = ? AND appointment_date = ? AND status != 'cancelled'`,
      [technicianId, today]
    );

    // Get pending appointments
    const [pendingAppointments] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM installation_appointments
       WHERE assigned_technician_id = ? AND status = 'scheduled' AND appointment_date >= ?`,
      [technicianId, today]
    );

    // Get completed this month
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    const [completedThisMonth] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM installation_appointments
       WHERE assigned_technician_id = ? AND status = 'completed'
       AND appointment_date >= ?`,
      [technicianId, firstOfMonth.toISOString().split('T')[0]]
    );

    // Get technician stats
    const [technicianStats] = await pool.execute<RowDataPacket[]>(
      `SELECT average_rating, total_installations FROM installation_technicians WHERE technician_id = ?`,
      [technicianId]
    );

    return {
      todayCount: todayAppointments[0]?.count || 0,
      pendingCount: pendingAppointments[0]?.count || 0,
      completedThisMonth: completedThisMonth[0]?.count || 0,
      averageRating: technicianStats[0]?.average_rating || 0,
      totalInstallations: technicianStats[0]?.total_installations || 0,
    };
  }

  /**
   * Update appointment status
   */
  private async updateAppointmentStatus(appointmentId: string, req: NextRequest, user: any) {
    const technicianId = await this.getTechnicianId(user);
    const pool = await getPool();

    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      throw new ApiError('Invalid appointment ID', 400);
    }

    const data = await this.getValidatedBody(req, UpdateAppointmentStatusSchema);

    // Verify appointment belongs to this technician
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT appointment_id FROM installation_appointments WHERE appointment_id = ? AND assigned_technician_id = ?',
      [id, technicianId]
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
      updates.push('technician_notes = ?');
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
    const technicianId = await this.getTechnicianId(user, false);

    // If no technician profile, return empty list
    if (!technicianId) {
      return [];
    }

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
        COALESCE(ua.street_address, '') as address,
        COALESCE(ua.city, '') as city,
        COALESCE(ua.state, '') as state,
        COALESCE(ua.postal_code, '') as postal_code,
        its.start_time as appointment_time,
        ia.appointment_type as type,
        ia.status,
        ia.customer_notes as notes,
        COALESCE(ia.estimated_duration, 60) as estimated_duration
      FROM installation_appointments ia
      LEFT JOIN users u ON ia.customer_id = u.user_id
      LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
      WHERE ia.assigned_technician_id = ?
        AND ia.appointment_date BETWEEN ? AND ?
        AND ia.status != 'cancelled'
      ORDER BY ia.appointment_date ASC, its.start_time ASC`,
      [technicianId, startDate, endDate]
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
}
