import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { expertId, date, timeSlot, consultationType, notes } = body;

    // Validate required fields
    if (!expertId || !date || !timeSlot || !consultationType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if the time slot is still available
      const availabilityCheck = await client.query(
        `SELECT consultation_id 
         FROM consultations 
         WHERE expert_id = $1 
         AND date = $2 
         AND time_slot = $3 
         AND status != 'cancelled'`,
        [expertId, date, timeSlot]
      );

      if (availabilityCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'Time slot no longer available' },
          { status: 409 }
        );
      }

      // Create the consultation
      const consultationQuery = `
        INSERT INTO consultations (
          user_id,
          expert_id,
          date,
          time_slot,
          consultation_type,
          notes,
          status,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', NOW(), NOW())
      `;

      const [result] = await client.execute(consultationQuery, [
        user.userId,
        expertId,
        date,
        timeSlot,
        consultationType,
        notes
      ]);

      const consultationId = (result as any).insertId;

      // Send notification to expert (in a real app, this would use a notification service)
      const notificationQuery = `
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          created_at
        ) VALUES ($1, 'new_consultation', 'New Consultation Booked', $2, NOW())
      `;

      await client.execute(notificationQuery, [
        expertId,
        `New consultation booked for ${date} at ${timeSlot}`
      ]);

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Consultation booked successfully',
        consultationId: consultationId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error booking consultation:', error);
    return NextResponse.json(
      { error: 'Failed to book consultation' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const expertId = searchParams.get('expertId');

    const pool = await getPool();
    
    // Get expert's availability
    const availabilityQuery = `
      SELECT *
      FROM expert_availability
      WHERE expert_id = ?
      AND date >= CURRENT_DATE
      ORDER BY date, start_time`;

    // Get user's consultations
    const consultationsQuery = `
      SELECT 
        c.*,
        e.first_name as expert_first_name,
        e.last_name as expert_last_name
      FROM consultations c
      JOIN experts e ON c.expert_id = e.expert_id
      WHERE c.user_id = ?
      ORDER BY c.consultation_date DESC, c.start_time DESC`;

    const values: any[] = [user.userId];
    let valueIndex = 2;

    if (status) {
      consultationsQuery += ` AND c.status = ?`;
      values.push(status);
      valueIndex++;
    }

    if (expertId) {
      consultationsQuery += ` AND c.expert_id = ?`;
      values.push(expertId);
    }

    const result = await pool.query(consultationsQuery, values);

    return NextResponse.json({
      consultations: result.rows
    });

  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultations' },
      { status: 500 }
    );
  }
} 