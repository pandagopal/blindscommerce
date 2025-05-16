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
        await client.query(
          `INSERT INTO window_measurements (
            user_id,
            label,
            width,
            height,
            points,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            user.userId,
            measurement.label,
            measurement.distance, // Using distance as width for now
            0, // Height will be added when measuring height
            JSON.stringify(measurement.points)
          ]
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
    const result = await pool.query(
      `SELECT * FROM window_measurements 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user.userId]
    );

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