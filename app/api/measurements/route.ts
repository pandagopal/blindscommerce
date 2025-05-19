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
    const { measurements } = body;

    if (!measurements || !Array.isArray(measurements)) {
      return NextResponse.json(
        { error: 'Invalid measurements data' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Save each measurement
      for (const measurement of measurements) {
        const measurementQuery = `
          INSERT INTO measurements (
            user_id,
            room_type,
            window_count,
            width,
            height,
            created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `;

        const [measurementResult] = await client.execute(measurementQuery, [
          user.userId,
          measurement.roomType,
          measurement.windowCount,
          measurement.width,
          measurement.height
        ]);

        const measurementId = (measurementResult as any).insertId;

        // Get saved measurement
        const [savedMeasurement] = await client.execute(
          'SELECT * FROM measurements WHERE measurement_id = ?',
          [measurementId]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Measurements saved successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving measurements:', error);
    return NextResponse.json(
      { error: 'Failed to save measurements' },
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

    const pool = await getPool();
    const query = `
      SELECT *
      FROM measurements
      WHERE user_id = ?
      ORDER BY created_at DESC`;
    const result = await pool.query(query, [user.userId]);

    return NextResponse.json({
      measurements: result.rows
    });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    );
  }
} 