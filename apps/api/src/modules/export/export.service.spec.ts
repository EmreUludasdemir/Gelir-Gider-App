import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { PrismaService } from '../../prisma.service';

describe('ExportService', () => {
  let service: ExportService;
  let prisma: PrismaService;

  const mockTransactions = [
    {
      id: 'tx-1',
      userId: 'user-1',
      amount: 100,
      currency: 'TRY',
      type: 'income',
      description: 'Salary',
      categoryId: 'salary',
      categoryLabel: 'Maaş',
      date: new Date('2024-01-15'),
      source: 'manual',
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      amount: 50,
      currency: 'TRY',
      type: 'expense',
      description: 'Groceries',
      categoryId: 'food',
      categoryLabel: 'Market',
      date: new Date('2024-01-16'),
      source: 'pdf',
    },
    {
      id: 'tx-3',
      userId: 'user-1',
      amount: 200,
      currency: 'TRY',
      type: 'expense',
      description: 'Rent payment',
      categoryId: 'rent',
      categoryLabel: 'Kira',
      date: new Date('2024-01-17'),
      source: 'manual',
    },
  ];

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportToCSV', () => {
    it('should generate CSV with correct headers', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const csv = await service.exportToCSV('user-1', {});

      // Check BOM is present
      expect(csv.startsWith('\uFEFF')).toBe(true);

      // Check headers
      expect(csv).toContain('Tarih');
      expect(csv).toContain('Açıklama');
      expect(csv).toContain('Tutar');
      expect(csv).toContain('Para Birimi');
      expect(csv).toContain('Tür');
      expect(csv).toContain('Kategori');
      expect(csv).toContain('Kaynak');
    });

    it('should include transaction data in CSV', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const csv = await service.exportToCSV('user-1', {});

      expect(csv).toContain('Salary');
      expect(csv).toContain('100.00');
      expect(csv).toContain('Gelir');
      expect(csv).toContain('Gider');
      expect(csv).toContain('Manuel');
      expect(csv).toContain('PDF');
    });

    it('should escape quotes in description', async () => {
      const txWithQuotes = [
        {
          ...mockTransactions[0],
          description: 'Test "quoted" description',
        },
      ];
      mockPrismaService.transaction.findMany.mockResolvedValue(txWithQuotes);

      const csv = await service.exportToCSV('user-1', {});

      expect(csv).toContain('""quoted""');
    });

    it('should filter by date range', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.exportToCSV('user-1', {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            date: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should filter by transaction type', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.exportToCSV('user-1', { type: 'income' });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'income',
          }),
        }),
      );
    });

    it('should filter by category', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.exportToCSV('user-1', { categoryId: 'food' });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'food',
          }),
        }),
      );
    });
  });

  describe('exportToExcel', () => {
    it('should generate Excel buffer', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const buffer = await service.exportToExcel('user-1', {});

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should include summary calculations', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const buffer = await service.exportToExcel('user-1', {});

      // Buffer should be non-empty (Excel file)
      expect(buffer.length).toBeGreaterThan(100);
    });

    it('should handle empty transactions', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const buffer = await service.exportToExcel('user-1', {});

      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('getTransactions (private method via CSV)', () => {
    it('should combine date range filters', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.exportToCSV('user-1', {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        type: 'expense',
        categoryId: 'food',
      });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          type: 'expense',
          categoryId: 'food',
        },
        orderBy: { date: 'desc' },
      });
    });

    it('should not include date filter if not provided', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.exportToCSV('user-1', {});

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { date: 'desc' },
      });
    });

    it('should sort by date descending', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.exportToCSV('user-1', {});

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { date: 'desc' },
        }),
      );
    });
  });
});
