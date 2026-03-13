import { INestApplication, ValidationPipe } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { AiController } from './ai.controller'
import { SpendingAnalyzerService } from './spending-analyzer.service'
import { AnomalyDetectorService } from './anomaly-detector.service'
import { AutoCategorizerService } from './auto-categorizer.service'
import { AiChatService } from './ai-chat.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

describe('AiController', () => {
  let app: INestApplication

  const spendingAnalyzer = {
    generateInsights: jest.fn(),
    predictSpending: jest.fn(),
    findSavingsOpportunities: jest.fn(),
  }

  const anomalyDetector = {
    getAnomalySummary: jest.fn(),
    analyzeTransaction: jest.fn(),
  }

  const autoCategorizer = {
    categorize: jest.fn(),
    getSuggestions: jest.fn(),
    learnFromCorrection: jest.fn(),
  }

  const aiChat = {
    chat: jest.fn(),
    parseTransaction: jest.fn(),
  }

  const jwtAuthGuard = {
    canActivate: jest.fn((context) => {
      const request = context.switchToHttp().getRequest()
      request.user = { id: 'user-123' }
      return true
    }),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const moduleBuilder = Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 100,
          },
        ]),
      ],
      controllers: [AiController],
      providers: [
        { provide: SpendingAnalyzerService, useValue: spendingAnalyzer },
        { provide: AnomalyDetectorService, useValue: anomalyDetector },
        { provide: AutoCategorizerService, useValue: autoCategorizer },
        { provide: AiChatService, useValue: aiChat },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    })

    moduleBuilder.overrideGuard(JwtAuthGuard).useValue(jwtAuthGuard)

    const module: TestingModule = await moduleBuilder.compile()

    app = module.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('should read transactionId from path param for anomaly analysis', async () => {
    anomalyDetector.analyzeTransaction.mockResolvedValue({ isAnomaly: false })

    const response = await request(app.getHttpServer()).get('/ai/anomalies/txn-456')

    expect(response.status).toBe(200)
    expect(anomalyDetector.analyzeTransaction).toHaveBeenCalledWith('user-123', 'txn-456')
    expect(response.body).toEqual({ isAnomaly: false })
  })

  it('should reject invalid chat payloads with validation errors', async () => {
    const response = await request(app.getHttpServer())
      .post('/ai/chat')
      .send({ message: '   ' })

    expect(response.status).toBe(400)
    expect(aiChat.chat).not.toHaveBeenCalled()
  })

  it('should reject invalid category suggestion queries', async () => {
    const response = await request(app.getHttpServer()).get('/ai/category-suggestions?description=')

    expect(response.status).toBe(400)
    expect(autoCategorizer.getSuggestions).not.toHaveBeenCalled()
  })

  it('should throttle repeated chat requests', async () => {
    aiChat.chat.mockResolvedValue({ message: 'ok' })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .send({ message: `harcama ozet ${attempt}` })

      expect(response.status).toBe(201)
    }

    const throttled = await request(app.getHttpServer())
      .post('/ai/chat')
      .send({ message: 'limit testi' })

    expect(throttled.status).toBe(429)
  })
})
