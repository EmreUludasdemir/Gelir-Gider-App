/**
 * Transactions E2E Integration Tests - FAZ 3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma.service';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import {
  createMockUser,
  createMockTransaction,
  createMockPrismaService,
} from '../test-utils';

describe('Transactions Controller (e2e)', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createMockPrismaService>;

  const mockUser = createMockUser();
  const mockTransaction = createMockTransaction();

  // Mock guard to bypass authentication
  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = mockUser;
      return true;
    }),
  };

  beforeAll(async () => {
    prisma = createMockPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/transactions (GET)', () => {
    it('should return all transactions for user', async () => {
      prisma.transaction.findMany.mockResolvedValue([mockTransaction]);

      const response = await request(app.getHttpServer())
        .get('/transactions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by type', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/transactions?type=income')
        .expect(200);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'income',
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/transactions?dateFrom=2024-01-01&dateTo=2024-01-31')
        .expect(200);

      expect(prisma.transaction.findMany).toHaveBeenCalled();
    });

    it('should apply pagination', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/transactions?limit=10&offset=0')
        .expect(200);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
        }),
      );
    });
  });

  describe('/transactions/:id (GET)', () => {
    it('should return a single transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction);

      const response = await request(app.getHttpServer())
        .get(`/transactions/${mockTransaction.id}`)
        .expect(200);

      expect(response.body.id).toBe(mockTransaction.id);
    });

    it('should return 404 for non-existent transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/transactions/non-existent-id')
        .expect(404);
    });
  });

  describe('/transactions (POST)', () => {
    const createDto = {
      date: '2024-01-15',
      description: 'Test transaction',
      amount: 100,
      type: 'expense',
      categoryId: 'food',
      categoryLabel: 'Yiyecek',
    };

    it('should create a new transaction', async () => {
      prisma.transaction.create.mockResolvedValue({
        ...mockTransaction,
        ...createDto,
      });

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .send(createDto)
        .expect(201);

      expect(response.body.description).toBe(createDto.description);
    });

    it('should reject invalid transaction type', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send({ ...createDto, type: 'invalid' })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send({ description: 'Incomplete' })
        .expect(400);
    });

    it('should reject negative amounts', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send({ ...createDto, amount: -100 })
        .expect(400);
    });
  });

  describe('/transactions/:id (PATCH)', () => {
    const updateDto = {
      description: 'Updated description',
      amount: 150,
    };

    it('should update a transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.transaction.update.mockResolvedValue({
        ...mockTransaction,
        ...updateDto,
      });

      const response = await request(app.getHttpServer())
        .patch(`/transactions/${mockTransaction.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.description).toBe(updateDto.description);
    });

    it('should return 404 when updating non-existent transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/transactions/non-existent')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('/transactions/:id (DELETE)', () => {
    it('should delete a transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.transaction.delete.mockResolvedValue(mockTransaction);

      const response = await request(app.getHttpServer())
        .delete(`/transactions/${mockTransaction.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 when deleting non-existent transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/transactions/non-existent')
        .expect(404);
    });
  });

  describe('/transactions/summary (GET)', () => {
    it('should return dashboard summary', async () => {
      prisma.transaction.findMany.mockResolvedValue([mockTransaction]);

      const response = await request(app.getHttpServer())
        .get('/transactions/summary')
        .expect(200);

      expect(response.body).toHaveProperty('totals');
    });
  });
});
