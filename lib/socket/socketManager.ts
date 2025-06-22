import { Server, Socket } from 'socket.io';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Event types
export interface ChatEvent {
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

export interface ConsultationEvent {
  expertId: string;
  userId: string;
  status: 'connected' | 'disconnected' | 'waiting';
  consultationId: string;
}

export interface InstallationEvent {
  installerId: string;
  jobId: string;
  status: 'en_route' | 'arrived' | 'in_progress' | 'completed';
  coordinates?: { lat: number; lng: number };
}

export class SocketManager {
  private io: Server;
  private userSessions: Map<string, string> = new Map(); // userId -> socketId
  private expertSessions: Map<string, string> = new Map(); // expertId -> socketId
  private installerSessions: Map<string, string> = new Map(); // installerId -> socketId

  constructor(server: any) {
    this.io = new Server(server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket: Socket) => {

      // User authentication
      socket.on('authenticate', async ({ userId, role }) => {
        try {
          await this.authenticateUser(socket, userId, role);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Chat events
      socket.on('join_chat', ({ userId }) => this.handleJoinChat(socket, userId));
      socket.on('send_message', (data: ChatEvent) => this.handleChatMessage(socket, data));
      socket.on('user_typing', ({ userId, isTyping }) => this.handleUserTyping(socket, userId, isTyping));

      // Consultation events
      socket.on('join_consultation', (data: ConsultationEvent) => this.handleJoinConsultation(socket, data));
      socket.on('consultation_status', (data: ConsultationEvent) => this.handleConsultationStatus(socket, data));

      // Installation events
      socket.on('update_installation', (data: InstallationEvent) => this.handleInstallationUpdate(socket, data));
      socket.on('location_update', ({ installerId, coordinates }) => this.handleLocationUpdate(socket, installerId, coordinates));

      // Disconnect handling
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  private async authenticateUser(socket: Socket, userId: string, role: string) {
    const pool = await getPool();
    const [user] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );

    if (!user) {
      throw new Error('User not found or inactive');
    }

    // Store session based on role
    switch (role) {
      case 'expert':
        this.expertSessions.set(userId, socket.id);
        socket.join('experts');
        break;
      case 'installer':
        this.installerSessions.set(userId, socket.id);
        socket.join('installers');
        break;
      default:
        this.userSessions.set(userId, socket.id);
        socket.join(`user_${userId}`);
    }

    socket.emit('authenticated');
  }

  private async handleJoinChat(socket: Socket, userId: string) {
    const pool = await getPool();
    await pool.execute(
      'INSERT INTO chat_sessions (user_id, socket_id, status, created_at) VALUES (?, ?, "active", NOW())',
      [userId, socket.id]
    );

    // Send welcome message
    socket.emit('message', {
      id: Date.now().toString(),
      content: 'Welcome to Smart Blinds Hub! How can we help you today?',
      sender: 'agent',
      timestamp: new Date(),
      agentName: 'Support Team',
      agentAvatar: '/images/support-avatar.png'
    });
  }

  private async handleChatMessage(socket: Socket, data: ChatEvent) {
    const pool = await getPool();
    await pool.execute(
      'INSERT INTO chat_messages (session_id, user_id, content, sender, created_at) VALUES ((SELECT id FROM chat_sessions WHERE socket_id = ? AND status = "active"), ?, ?, ?, NOW())',
      [socket.id, data.userId, data.message.content, data.message.sender]
    );

    // Broadcast to appropriate recipients
    if (data.message.sender === 'user') {
      this.io.to('support_agents').emit('new_message', data);
    } else {
      this.io.to(`user_${data.userId}`).emit('message', data.message);
    }
  }

  private handleUserTyping(socket: Socket, userId: string, isTyping: boolean) {
    this.io.to('support_agents').emit('user_typing', { userId, isTyping });
  }

  private handleJoinConsultation(socket: Socket, data: ConsultationEvent) {
    const roomId = `consultation_${data.consultationId}`;
    socket.join(roomId);
    this.io.to(roomId).emit('consultation_joined', {
      userId: data.userId,
      status: data.status
    });
  }

  private handleConsultationStatus(socket: Socket, data: ConsultationEvent) {
    const roomId = `consultation_${data.consultationId}`;
    this.io.to(roomId).emit('consultation_status', data);
  }

  private handleInstallationUpdate(socket: Socket, data: InstallationEvent) {
    // Update installation status in database
    this.updateInstallationStatus(data);
    
    // Notify customer
    this.io.to(`user_${data.jobId}`).emit('installation_update', data);
  }

  private handleLocationUpdate(socket: Socket, installerId: string, coordinates: { lat: number; lng: number }) {
    // Store location update
    this.updateInstallerLocation(installerId, coordinates);
    
    // Broadcast to relevant customers
    this.broadcastLocationUpdate(installerId, coordinates);
  }

  private async handleDisconnect(socket: Socket) {
    const pool = await getPool();
    await pool.execute(
      'UPDATE chat_sessions SET status = "ended", ended_at = NOW() WHERE socket_id = ?',
      [socket.id]
    );

    // Clean up session maps
    this.cleanupSessions(socket.id);
  }

  private async updateInstallationStatus(data: InstallationEvent) {
    const pool = await getPool();
    await pool.execute(
      'UPDATE installation_jobs SET status = ?, updated_at = NOW() WHERE id = ?',
      [data.status, data.jobId]
    );
  }

  private async updateInstallerLocation(installerId: string, coordinates: { lat: number; lng: number }) {
    const pool = await getPool();
    await pool.execute(
      'UPDATE installer_locations SET latitude = ?, longitude = ?, updated_at = NOW() WHERE installer_id = ?',
      [coordinates.lat, coordinates.lng, installerId]
    );
  }

  private async broadcastLocationUpdate(installerId: string, coordinates: { lat: number; lng: number }) {
    const pool = await getPool();
    const [jobs] = await pool.execute(
      'SELECT customer_id FROM installation_jobs WHERE installer_id = ? AND status IN ("en_route", "scheduled") AND scheduled_date = CURDATE()',
      [installerId]
    );

    for (const job of jobs as any[]) {
      this.io.to(`user_${job.customer_id}`).emit('installer_location', {
        installerId,
        coordinates
      });
    }
  }

  private cleanupSessions(socketId: string) {
    // Remove socket ID from all session maps
    for (const [userId, sid] of this.userSessions.entries()) {
      if (sid === socketId) this.userSessions.delete(userId);
    }
    for (const [expertId, sid] of this.expertSessions.entries()) {
      if (sid === socketId) this.expertSessions.delete(expertId);
    }
    for (const [installerId, sid] of this.installerSessions.entries()) {
      if (sid === socketId) this.installerSessions.delete(installerId);
    }
  }
}

// Export a singleton instance
let socketManager: SocketManager | null = null;

export function initSocketManager(server: any) {
  if (!socketManager) {
    socketManager = new SocketManager(server);
  }
  return socketManager;
}

export function getSocketManager() {
  if (!socketManager) {
    throw new Error('Socket manager not initialized');
  }
  return socketManager;
}
