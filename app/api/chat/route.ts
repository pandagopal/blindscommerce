import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { pusher } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, chatId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert the message
      const result = await client.query(
        `INSERT INTO chat_messages (
          chat_id,
          user_id,
          message,
          created_at
        ) VALUES ($1, $2, $3, NOW())
        RETURNING message_id, created_at`,
        [chatId || null, user.userId, message]
      );

      const messageId = result.rows[0].message_id;
      const createdAt = result.rows[0].created_at;

      // If this is a new chat, create a chat session
      if (!chatId) {
        const chatResult = await client.query(
          `INSERT INTO chat_sessions (
            user_id,
            status,
            created_at,
            updated_at
          ) VALUES ($1, 'active', NOW(), NOW())
          RETURNING chat_id`,
          [user.userId]
        );

        // Update the message with the new chat_id
        await client.query(
          'UPDATE chat_messages SET chat_id = $1 WHERE message_id = $2',
          [chatResult.rows[0].chat_id, messageId]
        );
      }

      await client.query('COMMIT');

      // Trigger real-time update via Pusher
      await pusher.trigger('chat', 'new-message', {
        messageId,
        chatId,
        userId: user.userId,
        message,
        createdAt
      });

      return NextResponse.json({
        message: 'Message sent successfully',
        messageId,
        createdAt
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
    const chatId = searchParams.get('chatId');

    const pool = await getPool();
    
    let query = `
      SELECT 
        cm.message_id,
        cm.chat_id,
        cm.user_id,
        cm.message,
        cm.created_at,
        u.first_name,
        u.last_name,
        CASE 
          WHEN u.role = 'admin' THEN true
          WHEN EXISTS (SELECT 1 FROM support_staff ss WHERE ss.user_id = u.user_id) THEN true
          ELSE false
        END as is_agent
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.user_id
    `;

    const values: any[] = [];
    if (chatId) {
      query += ' WHERE cm.chat_id = $1';
      values.push(chatId);
    } else {
      query += ' WHERE cm.user_id = $1';
      values.push(user.userId);
    }

    query += ' ORDER BY cm.created_at DESC LIMIT 50';

    const result = await pool.query(query, values);

    return NextResponse.json({
      messages: result.rows
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 