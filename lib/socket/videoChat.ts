import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const initVideoChat = (server: NetServer) => {
  const io = new SocketIOServer(server);
  
  const rooms = new Map();
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (roomId: string, userId: string) => {
      // Leave previous room if any
      Array.from(socket.rooms).forEach((room) => {
        if (room !== socket.id) socket.leave(room);
      });

      // Join new room
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(userId);

      // Notify others in room
      socket.to(roomId).emit('user-joined', userId);

      console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on('offer', (data: { roomId: string; offer: RTCSessionDescriptionInit }) => {
      socket.to(data.roomId).emit('offer', {
        offer: data.offer,
        from: socket.id,
      });
    });

    socket.on('answer', (data: { roomId: string; answer: RTCSessionDescriptionInit }) => {
      socket.to(data.roomId).emit('answer', {
        answer: data.answer,
        from: socket.id,
      });
    });

    socket.on('ice-candidate', (data: { roomId: string; candidate: RTCIceCandidateInit }) => {
      socket.to(data.roomId).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id,
      });
    });

    socket.on('disconnect', () => {
      // Remove user from all rooms
      rooms.forEach((users, roomId) => {
        users.delete(socket.id);
        if (users.size === 0) {
          rooms.delete(roomId);
        }
        socket.to(roomId).emit('user-left', socket.id);
      });
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};
