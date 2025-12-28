/**
 * Realtime Gateway Tests - PR-2
 * Tests for WebSocket gateway with JWT authentication
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeGateway } from './realtime.gateway';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: jest.Mocked<JwtService>;

  const mockSocket = (overrides: Partial<Socket> = {}): Socket => {
    return {
      id: 'socket-123',
      handshake: {
        auth: { token: 'valid-token' },
        headers: {},
      },
      data: {},
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
      ...overrides,
    } as unknown as Socket;
  };

  const mockServer = (): Server => {
    return {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as Server;
  };

  beforeEach(async () => {
    const mockJwtService = {
      verify: jest.fn(),
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
    jwtService = module.get(JwtService);

    // Set up server mock
    gateway.server = mockServer();
  });

  describe('handleConnection', () => {
    it('should accept connection with valid token', async () => {
      const socket = mockSocket();
      jwtService.verify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' });

      await gateway.handleConnection(socket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(socket.join).toHaveBeenCalledWith('user:user-123');
      expect(socket.emit).toHaveBeenCalledWith('connected', {
        userId: 'user-123',
        socketId: 'socket-123',
      });
      expect(socket.data.userId).toBe('user-123');
    });

    it('should reject connection without token', async () => {
      const socket = mockSocket({
        handshake: { auth: {}, headers: {} } as Socket['handshake'],
      });

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should reject connection with invalid token', async () => {
      const socket = mockSocket();
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should accept token from Authorization header', async () => {
      const socket = mockSocket({
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
        } as Socket['handshake'],
      });
      jwtService.verify.mockReturnValue({ userId: 'user-456', email: 'test@example.com' });

      await gateway.handleConnection(socket);

      expect(jwtService.verify).toHaveBeenCalledWith('header-token');
      expect(socket.join).toHaveBeenCalledWith('user:user-456');
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up user socket mapping on disconnect', async () => {
      const socket = mockSocket();
      jwtService.verify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' });

      await gateway.handleConnection(socket);
      expect(gateway.isUserOnline('user-123')).toBe(true);

      gateway.handleDisconnect(socket);
      expect(gateway.isUserOnline('user-123')).toBe(false);
    });

    it('should handle disconnect for unauthenticated socket', () => {
      const socket = mockSocket();
      socket.data.userId = undefined;

      expect(() => gateway.handleDisconnect(socket)).not.toThrow();
    });
  });

  describe('handlePing', () => {
    it('should respond to ping with pong', () => {
      const socket = mockSocket();

      const result = gateway.handlePing(socket);

      expect(result).toEqual({
        event: 'pong',
        data: { timestamp: expect.any(Number) },
      });
    });
  });

  describe('handleSubscribe', () => {
    it('should subscribe authenticated client to channels', async () => {
      const socket = mockSocket();
      jwtService.verify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' });
      await gateway.handleConnection(socket);

      const result = gateway.handleSubscribe(socket, { channels: ['budgets', 'transactions'] });

      expect(socket.join).toHaveBeenCalledWith('user-123:budgets');
      expect(socket.join).toHaveBeenCalledWith('user-123:transactions');
      expect(result).toEqual({ subscribed: ['budgets', 'transactions'] });
    });

    it('should reject subscribe for unauthenticated client', () => {
      const socket = mockSocket();
      socket.data.userId = undefined;

      const result = gateway.handleSubscribe(socket, { channels: ['budgets'] });

      expect(result).toEqual({ error: 'Not authenticated' });
    });
  });

  describe('handleUnsubscribe', () => {
    it('should unsubscribe authenticated client from channels', async () => {
      const socket = mockSocket();
      jwtService.verify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' });
      await gateway.handleConnection(socket);

      const result = gateway.handleUnsubscribe(socket, { channels: ['budgets'] });

      expect(socket.leave).toHaveBeenCalledWith('user-123:budgets');
      expect(result).toEqual({ unsubscribed: ['budgets'] });
    });
  });

  describe('notifyNewTransaction', () => {
    it('should emit transaction:created event to user room', () => {
      const transaction = {
        id: 'tx-123',
        description: 'Test transaction',
        amount: 100,
        type: 'expense' as const,
        categoryLabel: 'Food',
      };

      gateway.notifyNewTransaction('user-123', transaction);

      expect(gateway.server.to).toHaveBeenCalledWith('user:user-123');
      expect(gateway.server.emit).toHaveBeenCalledWith('transaction:created', {
        type: 'transaction:created',
        data: transaction,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('notifyBudgetAlert', () => {
    it('should emit budget:alert event to user room', () => {
      const alert = {
        categoryId: 'cat-123',
        categoryName: 'Food',
        spent: 800,
        limit: 1000,
        percentage: 80,
      };

      gateway.notifyBudgetAlert('user-123', alert);

      expect(gateway.server.to).toHaveBeenCalledWith('user:user-123');
      expect(gateway.server.emit).toHaveBeenCalledWith('budget:alert', {
        type: 'budget:alert',
        data: alert,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('utility methods', () => {
    it('isUserOnline should return false for offline user', () => {
      expect(gateway.isUserOnline('non-existent')).toBe(false);
    });

    it('getOnlineUserCount should return 0 initially', () => {
      expect(gateway.getOnlineUserCount()).toBe(0);
    });

    it('getUserConnectionCount should return 0 for non-connected user', () => {
      expect(gateway.getUserConnectionCount('user-123')).toBe(0);
    });

    it('should track multiple connections for same user', async () => {
      const socket1 = mockSocket({ id: 'socket-1' } as Partial<Socket>);
      const socket2 = mockSocket({ id: 'socket-2' } as Partial<Socket>);
      jwtService.verify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' });

      await gateway.handleConnection(socket1);
      await gateway.handleConnection(socket2);

      expect(gateway.getUserConnectionCount('user-123')).toBe(2);
      expect(gateway.getOnlineUserCount()).toBe(1);

      gateway.handleDisconnect(socket1);
      expect(gateway.getUserConnectionCount('user-123')).toBe(1);
      expect(gateway.isUserOnline('user-123')).toBe(true);

      gateway.handleDisconnect(socket2);
      expect(gateway.getUserConnectionCount('user-123')).toBe(0);
      expect(gateway.isUserOnline('user-123')).toBe(false);
    });
  });

  describe('broadcastToAll', () => {
    it('should broadcast event to all connected clients', () => {
      const data = { message: 'System maintenance' };

      gateway.broadcastToAll('system:announcement', data);

      expect(gateway.server.emit).toHaveBeenCalledWith('system:announcement', {
        type: 'system:announcement',
        data,
        timestamp: expect.any(Number),
      });
    });
  });
});
