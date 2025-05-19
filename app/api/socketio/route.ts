import { Server } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';
import { getPool } from '@/lib/db';

interface ChatMessage {
  userId: string;
  message: {
    id: string;
    content: string;
    sender: 'user' | 'agent';
    timestamp: Date;
    agentName?: string;
    agentAvatar?: string;
  };
}

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join_chat', async ({ userId }) => {
        socket.join(`user_${userId}`);

        // Send welcome message
        socket.emit('message', {
          id: Date.now().toString(),
          content: 'Welcome to Smart Blinds Hub! How can we help you today?',
          sender: 'agent',
          timestamp: new Date(),
          agentName: 'Support Team',
          agentAvatar: '/images/support-avatar.png',
        });

        // Store chat session in database
        const pool = await getPool();
        await pool.query(
          `INSERT INTO chat_sessions (
            user_id,
            socket_id,
            status,
            created_at
          ) VALUES (?, ?, 'active', NOW())`,
          [userId, socket.id]
        );
      });

      socket.on('send_message', async ({ userId, message }: ChatMessage) => {
        // Store message in database
        const pool = await getPool();
        await pool.query(
          `INSERT INTO chat_messages (
            session_id,
            user_id,
            content,
            sender,
            created_at
          ) VALUES (
            (SELECT session_id FROM chat_sessions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1),
            ?,
            ?,
            ?,
            NOW()
          )`,
          [userId, message.content, message.sender]
        );

        // Broadcast message to support agents
        io.to('support_agents').emit('new_customer_message', {
          userId,
          message,
        });

        // Auto-response for demo
        setTimeout(() => {
          const response = {
            id: Date.now().toString(),
            content: 'Thank you for your message. An agent will respond shortly.',
            sender: 'agent',
            timestamp: new Date(),
            agentName: 'Support Team',
            agentAvatar: '/images/support-avatar.png',
          };

          socket.emit('message', response);

          // Store auto-response in database
          pool.query(
            `INSERT INTO chat_messages (
              session_id,
              user_id,
              content,
              sender,
              created_at
            ) VALUES (
              (SELECT session_id FROM chat_sessions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1),
              ?,
              ?,
              'agent',
              NOW()
            )`,
            [userId, response.content]
          );
        }, 1000);
      });

      socket.on('user_typing', ({ userId, isTyping }) => {
        // Broadcast typing status to support agents
        io.to('support_agents').emit('customer_typing', {
          userId,
          isTyping,
        });
      });

      socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id);

        // Update chat session status
        const pool = await getPool();
        await pool.query(
          `UPDATE chat_sessions 
           SET status = 'ended', ended_at = NOW() 
           WHERE socket_id = ?`,
          [socket.id]
        );
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export const GET = ioHandler;
export const POST = ioHandler; 