import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { pusher } from '@/lib/pusher';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const pool = await getPool();

    let currentSessionId = sessionId;

    // Create chat session if it doesn't exist
    if (!currentSessionId) {
      const sessionQuery = `
        INSERT INTO chat_sessions (
          user_id,
          session_type,
          status,
          started_at
        ) VALUES (?, 'support', 'waiting', NOW())
      `;

      const [sessionResult] = await pool.execute(sessionQuery, [user.userId]);
      currentSessionId = (sessionResult as any).insertId;
    }

    // Create message
    const messageQuery = `
      INSERT INTO chat_messages (
        session_id,
        user_id,
        message,
        message_type,
        sent_at
      ) VALUES (?, ?, ?, 'text', NOW())
    `;

    const [messageResult] = await pool.execute(messageQuery, [
      currentSessionId,
      user.userId,
      message
    ]);

    const messageId = (messageResult as any).insertId;

    // Get message with timestamp
    const [messageRows] = await pool.execute<RowDataPacket[]>(
      'SELECT message_id, sent_at FROM chat_messages WHERE message_id = ?',
      [messageId]
    );

    // Trigger real-time update via Pusher
    await pusher.trigger('chat', 'new-message', {
      messageId,
      sessionId: currentSessionId,
      userId: user.userId,
      message,
      sentAt: messageRows[0].sent_at
    });

    return NextResponse.json({
      message: 'Message sent successfully',
      messageId,
      sessionId: currentSessionId,
      sentAt: messageRows[0].sent_at
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
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
    const sessionId = searchParams.get('sessionId');

    const pool = await getPool();
    
    let query = `
      SELECT 
        cm.message_id,
        cm.session_id,
        cm.user_id,
        cm.message,
        cm.sent_at,
        u.first_name,
        u.last_name,
        CASE 
          WHEN u.role = 'admin' THEN true
          WHEN u.role = 'sales_representative' THEN true
          ELSE false
        END as is_agent
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.user_id
    `;

    const params: any[] = [];
    if (sessionId) {
      query += ' WHERE cm.session_id = ?';
      params.push(sessionId);
    } else {
      // Get messages from all sessions for this user
      query += ` WHERE cm.session_id IN (
        SELECT session_id FROM chat_sessions WHERE user_id = ?
      )`;
      params.push(user.userId);
    }

    query += ' ORDER BY cm.sent_at DESC LIMIT 50';

    const [result] = await pool.execute(query, params);

    return NextResponse.json({
      messages: result
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 