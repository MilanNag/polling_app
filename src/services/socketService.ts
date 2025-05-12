import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import redis from '../config/redis';
import { verifyToken } from '../utils/jwt';
import logger from '../utils/logger';

class SocketService {
  private io: SocketServer | null = null;

  // Initialize Socket.IO server
  initialize(server: HTTPServer): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: '*', // In production, set to your frontend domain
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    // Set up authentication middleware
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        // Allow anonymous connections for viewing results
        if (!token) {
          socket.data.authenticated = false;
          return next();
        }
        
        // Verify token if provided
        const decoded = verifyToken(token);
        socket.data.user = decoded;
        socket.data.authenticated = true;
        next();
      } catch (error) {
        // Don't reject connection on auth failure, just mark as unauthenticated
        socket.data.authenticated = false;
        next();
      }
    });
    
    this.io.on('connection', (socket) => this.handleConnection(socket));
    
    // Subscribe to Redis channel for vote updates
    this.setupRedisSubscription();
    
    logger.info('Socket.IO server initialized');
  }
  
  // Handle new socket connections
  private handleConnection(socket: Socket): void {
    logger.debug(`Socket connected: ${socket.id}`);
    
    // Handle room subscription
    socket.on('subscribe', (pollId: string) => {
      // Join the poll room
      socket.join(`poll:${pollId}`);
      logger.debug(`Socket ${socket.id} joined room poll:${pollId}`);
    });
    
    // Handle room unsubscription
    socket.on('unsubscribe', (pollId: string) => {
      socket.leave(`poll:${pollId}`);
      logger.debug(`Socket ${socket.id} left room poll:${pollId}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  }
  
  // Setup Redis subscription for cross-instance communication
  private setupRedisSubscription(): void {
    redis.subscribe('vote-updates', (message) => {
      try {
        const data = JSON.parse(message);
        this.emitToRoom(`poll:${data.pollId}`, 'vote-update', data);
      } catch (error) {
        logger.error('Error processing Redis message', error);
      }
    });
  }
  
  // Emit event to a specific room
  emitToRoom(room: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn('Socket.IO server not initialized');
      return;
    }
    
    this.io.to(room).emit(event, data);
  }
  
  // Broadcast vote update
  broadcastVoteUpdate(pollId: string, update: any): void {
    const message = JSON.stringify({
      pollId,
      ...update,
      timestamp: new Date().toISOString()
    });
    
    // Publish update to Redis for cross-instance broadcasts
    redis.publish('vote-updates', message);
  }
}

export default new SocketService();