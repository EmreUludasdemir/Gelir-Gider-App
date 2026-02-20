import { UnauthorizedException } from '@nestjs/common';
import { AiController } from './ai.controller';
import { SpendingAnalyzerService } from './spending-analyzer.service';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { AutoCategorizerService } from './auto-categorizer.service';
import { AiChatService } from './ai-chat.service';

describe('AiController', () => {
  const spendingAnalyzer = {
    generateInsights: jest.fn(),
    predictSpending: jest.fn(),
    findSavingsOpportunities: jest.fn(),
  } as unknown as SpendingAnalyzerService;

  const anomalyDetector = {
    getAnomalySummary: jest.fn(),
    analyzeTransaction: jest.fn(),
  } as unknown as AnomalyDetectorService;

  const autoCategorizer = {
    categorize: jest.fn(),
    getSuggestions: jest.fn(),
    learnFromCorrection: jest.fn(),
  } as unknown as AutoCategorizerService;

  const aiChat = {
    chat: jest.fn(),
  } as unknown as AiChatService;

  let controller: AiController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AiController(
      spendingAnalyzer,
      anomalyDetector,
      autoCategorizer,
      aiChat,
    );
  });

  it('should read transactionId from path param for anomaly analysis', async () => {
    (anomalyDetector.analyzeTransaction as jest.Mock).mockResolvedValue({
      isAnomaly: false,
    });

    const req = { user: { id: 'user-123' } };
    const result = await controller.analyzeTransaction(req, 'txn-456');

    expect(anomalyDetector.analyzeTransaction).toHaveBeenCalledWith(
      'user-123',
      'txn-456',
    );
    expect(result).toEqual({ isAnomaly: false });
  });

  it('should fallback to user.userId when user.id is not present', async () => {
    (anomalyDetector.analyzeTransaction as jest.Mock).mockResolvedValue({
      isAnomaly: true,
    });

    await controller.analyzeTransaction({ user: { userId: 'user-789' } }, 'txn-1');

    expect(anomalyDetector.analyzeTransaction).toHaveBeenCalledWith(
      'user-789',
      'txn-1',
    );
  });

  it('should throw UnauthorizedException when user context is missing', async () => {
    await expect(
      controller.analyzeTransaction({}, 'txn-999'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
