import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { Transaction } from "@prisma/client";
import {
  CreateBankConnectionDto,
  UpdateBankConnectionDto,
} from "./dto/bank-connection.dto";
import { MockBankAdapter } from "./adapters/mock-bank.adapter";
import {
  IBankAdapter,
  BankTransaction,
} from "./adapters/bank-adapter.interface";

@Injectable()
export class BankConnectionsService {
  private adapters: Map<string, IBankAdapter> = new Map();

  constructor(private prisma: PrismaService) {
    // Register available adapters
    this.registerAdapter(new MockBankAdapter());
  }

  private registerAdapter(adapter: IBankAdapter) {
    this.adapters.set(adapter.getBankCode(), adapter);
  }

  private getAdapter(bankCode: string): IBankAdapter {
    const adapter = this.adapters.get(bankCode);
    if (!adapter) {
      throw new BadRequestException(`Bank adapter not found: ${bankCode}`);
    }
    return adapter;
  }

  async create(userId: string, dto: CreateBankConnectionDto) {
    // Validate bank code
    const adapter = this.getAdapter(dto.bankCode);

    // Connect to bank
    const result = await adapter.connect({
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken,
    });

    if (!result.success) {
      throw new BadRequestException(`Bank connection failed: ${result.error}`);
    }

    // Create bank connection record
    const connection = await this.prisma.bankConnection.create({
      data: {
        userId,
        bankCode: dto.bankCode,
        bankName: dto.bankName || adapter.getBankName(),
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        accountType: dto.accountType || "checking",
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        lastSyncStatus: "pending",
      },
    });

    return {
      ...connection,
      accounts: result.accounts,
    };
  }

  async findAll(userId: string) {
    return this.prisma.bankConnection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const connection = await this.prisma.bankConnection.findFirst({
      where: { id, userId },
    });

    if (!connection) {
      throw new NotFoundException("Bank connection not found");
    }

    return connection;
  }

  async update(userId: string, id: string, dto: UpdateBankConnectionDto) {
    await this.findOne(userId, id);

    return this.prisma.bankConnection.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    const connection = await this.findOne(userId, id);

    // Disconnect from bank
    const adapter = this.adapters.get(connection.bankCode);
    if (adapter && adapter.isConnected()) {
      await adapter.disconnect();
    }

    return this.prisma.bankConnection.delete({
      where: { id },
    });
  }

  async syncTransactions(userId: string, connectionId: string) {
    const connection = await this.findOne(userId, connectionId);
    const adapter = this.getAdapter(connection.bankCode);

    // Connect if not connected
    if (!adapter.isConnected()) {
      await adapter.connect({
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
      });
    }

    // Fetch transactions for last 30 days
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    const result = await adapter.getTransactions(
      connection.accountNumber || "default",
      fromDate,
      toDate
    );

    if (!result.success) {
      await this.prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "failed",
          syncError: result.error,
        },
      });
      throw new BadRequestException(`Sync failed: ${result.error}`);
    }

    // Convert bank transactions to app transactions
    const createdTransactions = await this.importTransactions(
      userId,
      connection.bankCode,
      result.transactions || []
    );

    // Update sync status
    await this.prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        syncError: null,
      },
    });

    return {
      syncedCount: createdTransactions.length,
      connection: await this.findOne(userId, connectionId),
    };
  }

  private async importTransactions(
    userId: string,
    bankCode: string,
    bankTransactions: BankTransaction[]
  ): Promise<Transaction[]> {
    const created: Transaction[] = [];

    for (const tx of bankTransactions) {
      // Check for duplicates
      const existing = await this.prisma.transaction.findFirst({
        where: {
          userId,
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          source: `bank:${bankCode}`,
        },
      });

      if (existing) {
        continue; // Skip duplicate
      }

      // Map category
      const category = this.mapCategory(tx.category, tx.type);

      const newTx = await this.prisma.transaction.create({
        data: {
          userId,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          date: tx.date,
          source: `bank:${bankCode}`,
          categoryId: category.id,
          categoryLabel: category.label,
          tags: "",
          confidence: 90, // Bank data is fairly reliable
        },
      });

      created.push(newTx);
    }

    return created;
  }

  private mapCategory(
    category: string | undefined,
    type: string
  ): { id: string; label: string } {
    const categoryMap: Record<string, { id: string; label: string }> = {
      // Expense categories
      market: { id: "market", label: "Market" },
      ulasim: { id: "ulasim", label: "Ulaşım" },
      yemek: { id: "yemek", label: "Yemek" },
      abonelik: { id: "abonelik", label: "Abonelik" },
      fatura: { id: "fatura", label: "Faturalar" },
      alisveris: { id: "alisveris", label: "Alışveriş" },
      saglik: { id: "saglik", label: "Sağlık" },
      // Income categories
      maas: { id: "maas", label: "Maaş" },
      freelance: { id: "freelance", label: "Freelance" },
      kira_geliri: { id: "kira_geliri", label: "Kira Geliri" },
      yatirim: { id: "yatirim", label: "Yatırım Geliri" },
    };

    if (category && categoryMap[category]) {
      return categoryMap[category];
    }

    // Default based on type
    return type === "income"
      ? { id: "diger_gelir", label: "Diğer Gelir" }
      : { id: "diger", label: "Diğer" };
  }

  async getAvailableBanks() {
    return Array.from(this.adapters.values()).map((adapter) => ({
      code: adapter.getBankCode(),
      name: adapter.getBankName(),
    }));
  }
}
