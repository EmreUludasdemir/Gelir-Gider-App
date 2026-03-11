import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getAllowedOrigins } from '../../shared';
import { AUTH_ACCESS_COOKIE, getCookieValue } from '../../shared/cookies';

interface JwtPayload {
  sub: string;
  email: string;
  type?: 'access' | 'refresh';
}

interface TransactionNotification {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryLabel: string;
}

interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  spent: number;
  limit: number;
  percentage: number;
}

interface BillReminder {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

interface SavingsMilestone {
  id: string;
  name: string;
  percentage: number;
  currentAmount: number;
  targetAmount: number;
}

@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client)

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload.type && payload.type !== 'access') {
        throw new Error('Invalid token type')
      }
      const userId = payload.sub;

      // Store user-socket mapping
      client.data.userId = userId;
      client.join(`user:${userId}`);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`User ${userId} connected (socket: ${client.id})`);

      // Send connection confirmation
      client.emit('connected', { userId, socketId: client.id });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  // ==================== Client Messages ====================

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() _client: Socket) {
    return { timestamp: Date.now() };
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channels: string[] }
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Not authenticated' };

    // Subscribe to additional channels (e.g., specific budget, goal)
    data.channels.forEach((channel) => {
      client.join(`${userId}:${channel}`);
    });

    return { subscribed: data.channels };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channels: string[] }
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Not authenticated' };

    data.channels.forEach((channel) => {
      client.leave(`${userId}:${channel}`);
    });

    return { unsubscribed: data.channels };
  }

  // ==================== Server Notifications ====================

  notifyNewTransaction(userId: string, transaction: TransactionNotification) {
    this.server.to(`user:${userId}`).emit('transaction:created', {
      type: 'transaction:created',
      data: transaction,
      timestamp: Date.now(),
    });
  }

  notifyTransactionUpdated(userId: string, transaction: TransactionNotification) {
    this.server.to(`user:${userId}`).emit('transaction:updated', {
      type: 'transaction:updated',
      data: transaction,
      timestamp: Date.now(),
    });
  }

  notifyTransactionDeleted(userId: string, transactionId: string) {
    this.server.to(`user:${userId}`).emit('transaction:deleted', {
      type: 'transaction:deleted',
      data: { id: transactionId },
      timestamp: Date.now(),
    });
  }

  notifyBudgetAlert(userId: string, alert: BudgetAlert) {
    this.server.to(`user:${userId}`).emit('budget:alert', {
      type: 'budget:alert',
      data: alert,
      timestamp: Date.now(),
    });
  }

  notifyBudgetUpdated(userId: string, budget: { id: string; spent: number; percentage: number }) {
    this.server.to(`user:${userId}`).emit('budget:updated', {
      type: 'budget:updated',
      data: budget,
      timestamp: Date.now(),
    });
  }

  notifyBillReminder(userId: string, bill: BillReminder) {
    this.server.to(`user:${userId}`).emit('bill:reminder', {
      type: 'bill:reminder',
      data: bill,
      timestamp: Date.now(),
    });
  }

  notifySavingsGoalMilestone(userId: string, goal: SavingsMilestone) {
    this.server.to(`user:${userId}`).emit('savings:milestone', {
      type: 'savings:milestone',
      data: goal,
      timestamp: Date.now(),
    });
  }

  notifySavingsGoalUpdated(userId: string, goal: { id: string; currentAmount: number; percentage: number }) {
    this.server.to(`user:${userId}`).emit('savings:updated', {
      type: 'savings:updated',
      data: goal,
      timestamp: Date.now(),
    });
  }

  notifySync(userId: string, syncResult: { source: string; imported: number; timestamp: Date }) {
    this.server.to(`user:${userId}`).emit('sync:completed', {
      type: 'sync:completed',
      data: syncResult,
      timestamp: Date.now(),
    });
  }

  // ==================== Utility Methods ====================

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  broadcastToAll(event: string, data: unknown) {
    this.server.emit(event, {
      type: event,
      data,
      timestamp: Date.now(),
    });
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth.token
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim()
    }

    const authorizationHeader = client.handshake.headers.authorization
    if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
      return authorizationHeader.slice('Bearer '.length).trim()
    }

    return getCookieValue(client.handshake.headers.cookie, AUTH_ACCESS_COOKIE)
  }
}
