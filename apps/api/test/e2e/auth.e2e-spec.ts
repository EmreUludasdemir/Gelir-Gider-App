import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma.service';
import { createMockUser, createMockPrismaService } from '../test-utils';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
    prisma.user.update.mockResolvedValue(mockUser);
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
  });

  describe('cookie-based session flow', () => {
    it('should set auth cookies on login, read session from /auth/me, refresh, and clear on logout', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const agent = request.agent(app.getHttpServer());

      const loginResponse = await agent
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'SecurePass123!' })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');
      expect(loginResponse.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token='),
          expect.stringContaining('refresh_token='),
        ]),
      );

      prisma.user.findUnique.mockResolvedValue(mockUser);
      const meResponse = await agent.get('/auth/me').expect(200);
      expect(meResponse.body).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      const refreshResponse = await agent
        .post('/auth/refresh')
        .send({})
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token='),
          expect.stringContaining('refresh_token='),
        ]),
      );

      const logoutResponse = await agent.post('/auth/logout').send({}).expect(200);
      expect(logoutResponse.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token=;'),
          expect.stringContaining('refresh_token=;'),
        ]),
      );
    });

    it('should reject /auth/me without authentication', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });
});
