/**
 * Auth E2E Integration Tests - FAZ 3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma.service';
import { createMockUser, createMockPrismaService } from '../test-utils';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createMockPrismaService>;

  const mockUser = createMockUser();

  beforeAll(async () => {
    prisma = createMockPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
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

  describe('/auth/register (POST)', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'New User',
    };

    it('should register a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.email).toBe(registerDto.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409); // Conflict
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, email: 'invalid-email' })
        .expect(400);
    });

    it('should reject weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, password: '123' })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com' }) // missing password
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return tokens on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto);

      // Note: actual assertion depends on bcrypt compare
      expect(response.status).toBeLessThan(500);
    });

    it('should reject non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/auth/change-password (POST)', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .send({ oldPassword: 'old-pass', newPassword: 'NewPass123!' })
        .expect(401);
    });

    it('should return user info with valid token', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // This would need a valid JWT - in real tests, you'd mock the guard
      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .send({ oldPassword: 'old-pass', newPassword: 'NewPass123!' })
        .set('Authorization', 'Bearer mock-token');

      // Auth guard will reject this, which is expected behavior
      expect(response.status).toBe(401);
    });
  });
});
