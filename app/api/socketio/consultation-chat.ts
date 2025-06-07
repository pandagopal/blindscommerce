import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const handleConsultationChat = (io: SocketIOServer) => {
  io.on('connection', async (socket) => {
    // Verify authentication
    const token = socket.handshake.auth.token;
    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const user = await verifyToken(token);
      if (!user) {
        socket.disconnect();
        return;
      }

      // Join consultation room
      socket.on('join-consultation', async (consultationId: string) => {
        const pool = await getPool();
        const [consultation] = await pool.execute(
          `SELECT * FROM consultations WHERE consultation_id = ? AND (user_id = ? OR expert_id = ?)`,
          [consultationId, user.userId, user.userId]
        );

        if (!consultation) {
          socket.emit('error', 'Unauthorized to join this consultation');
          return;
        }

        socket.join(`consultation-${consultationId}`);
        
        // Load previous messages
        const [messages] = await pool.execute(
          `SELECT * FROM consultation_messages 
           WHERE consultation_id = ? 
           ORDER BY created_at ASC`,
          [consultationId]
        );
        
        socket.emit('previous-messages', messages);
      });

      // Handle new messages
      socket.on('send-message', async (data: { 
        consultationId: string;
        message: string;
      }) => {
        const pool = await getPool();
        const [result] = await pool.execute(
          `INSERT INTO consultation_messages 
           (consultation_id, user_id, message, created_at) 
           VALUES (?, ?, ?, NOW())`,
          [data.consultationId, user.userId, data.message]
        );

        const messageId = (result as any).insertId;
        const [newMessage] = await pool.execute(
          `SELECT * FROM consultation_messages WHERE message_id = ?`,
          [messageId]
        );

        io.to(`consultation-${data.consultationId}`).emit('new-message', newMessage);
      });

      // Handle user typing status
      socket.on('typing', (data: { consultationId: string; isTyping: boolean }) => {
        socket.to(`consultation-${data.consultationId}`).emit('user-typing', {
          userId: user.userId,
          isTyping: data.isTyping
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', user.userId);
      });

    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.disconnect();
    }
  });
};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    handleConsultationChat(io);
  }

  res.end();
}
