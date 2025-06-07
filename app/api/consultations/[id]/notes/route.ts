import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { EmailService } from '@/lib/email/emailService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notes } = await req.json();
    const consultationId = params.id;

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update consultation notes
      await connection.execute(
        `UPDATE consultations 
         SET notes = ?, updated_at = NOW() 
         WHERE consultation_id = ? AND (user_id = ? OR expert_id = ?)`,
        [notes, consultationId, user.userId, user.userId]
      );

      // Add note to consultation history
      await connection.execute(
        `INSERT INTO consultation_history 
         (consultation_id, user_id, action_type, notes, created_at) 
         VALUES (?, ?, 'note_added', ?, NOW())`,
        [consultationId, user.userId, notes]
      );

      await connection.commit();

      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating consultation notes:', error);
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    );
  }
}
