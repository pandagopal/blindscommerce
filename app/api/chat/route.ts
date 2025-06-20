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
    const { message, chatId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const pool = await getPool();

    // Create message
    const messageQuery = `
      INSERT INTO chat_messages (
        chat_id,
        sender_id,
        message,
        created_at
      ) VALUES (?, ?, ?, NOW())
    `;

    const [messageResult] = await pool.execute(messageQuery, [
      chatId,
      user.userId,
      message
    ]);

    const messageId = (messageResult as any).insertId;

    // Get message with timestamp
    const [messageRows] = await pool.execute<RowDataPacket[]>(
      'SELECT message_id, created_at FROM chat_messages WHERE message_id = ?',
      [messageId]
    );

    // Create chat if it doesn't exist
    const chatQuery = `
      INSERT INTO chats (
        user_id,
        status,
        created_at,
        updated_at
      ) VALUES (?, 'active', NOW(), NOW())
    `;

    const [chatResult] = await pool.execute(chatQuery, [user.userId]);
    const newChatId = (chatResult as any).insertId;

    // Update the message with the new chat_id
    await pool.execute(
      'UPDATE chat_messages SET chat_id = ? WHERE message_id = ?',
      [newChatId, messageId]
    );

    // Trigger real-time update via Pusher
    await pusher.trigger('chat', 'new-message', {
      messageId,
      chatId: newChatId,
      userId: user.userId,
      message,
      createdAt: (messageRows[0] as any).created_at
    });

    return NextResponse.json({
      message: 'Message sent successfully',
      messageId,
      createdAt: (messageRows[0] as any).created_at
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

    const params: any[] = [];
    if (chatId) {
      query += ' WHERE cm.chat_id = ?';
      params.push(chatId);
    } else {
      query += ' WHERE cm.user_id = ?';
      params.push(user.userId);
    }

    query += ' ORDER BY cm.created_at DESC LIMIT 50';

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