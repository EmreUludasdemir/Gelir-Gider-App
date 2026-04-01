import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { Transaction } from "@prisma/client";
import { PrismaService } from "../../prisma.service";
import { EncryptionService } from "../../shared/encryption";
import { getFrontendBaseUrl } from "../../shared";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import {
  CreateBankConnectionDto,
  StartBankConnectionDto,
  UpdateBankConnectionDto,
  BankConnectionCallbackDto,
} from "./dto/bank-connection.dto";
import {
  AkbankAdapter,
  BankConnectionCredentials,
  BankLifecycleState,
  BankSyncStatus,
  BankTransaction,
  IBankAdapter,
  MockBankAdapter,
  GarantiAdapter,
  IsbankAdapter,
  NormalizedBankError,
} from "./adapters";

type ConnectionRecord = Awaited<
  ReturnType<PrismaService["bankConnection"]["findFirst"]>
>;

@Injectable()
export class BankConnectionsService {
  private readonly logger = new Logger(BankConnectionsService.name);
  private readonly adapters = new Map<string, IBankAdapter>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly realtime: RealtimeGateway
  ) {
    this.registerAdapter(new MockBankAdapter());
    this.registerAdapter(new AkbankAdapter());
    this.registerAdapter(new GarantiAdapter());
    this.registerAdapter(new IsbankAdapter());
    this.logger.log(`Registered ${this.adapters.size} bank adapters`);
  }

  async create(userId: string, dto: CreateBankConnectionDto) {
    const adapter = this.getAdapter(dto.bankCode);
    const credentials = this.buildCredentialsFromInput(dto);
    const accountsResult = await adapter.getAccounts(credentials);

    if (!accountsResult.success) {
      throw new BadRequestException(
        accountsResult.error?.message || "Banka bağlantısı kurulamadı."
      );
    }

    const account = this.pickPrimaryAccount(
      accountsResult.accounts || [],
      dto.accountNumber
    );

    const connection = await this.prisma.bankConnection.create({
      data: {
        userId,
        bankCode: dto.bankCode,
        bankName: dto.bankName || adapter.getBankName(),
        accountNumber: dto.accountNumber || account?.accountNumber,
        accountName: dto.accountName || account?.accountName,
        accountType: dto.accountType || account?.accountType || "checking",
        accessToken: this.encryptIfPresent(credentials.accessToken),
        refreshToken: this.encryptIfPresent(credentials.refreshToken),
        expiresAt: credentials.expiresAt || null,
        lifecycleState: "connected",
        lastSyncStatus: "pending",
        lastConsentAt: new Date(),
      },
    });

    return this.mapConnection(connection);
  }

  async startConnection(userId: string, dto: StartBankConnectionDto) {
    const adapter = this.getAdapter(dto.bankCode);
    const state = randomUUID();
    const redirectUri = this.getConnectionRedirectUri();
    const startResult = await adapter.startConnection({
      state,
      redirectUri,
    });

    if (!startResult.success || !startResult.authorizationUrl) {
      throw new BadRequestException(
        startResult.error?.message || "Banka bağlantısı başlatılamadı."
      );
    }

    const connection = await this.prisma.bankConnection.create({
      data: {
        userId,
        bankCode: dto.bankCode,
        bankName: dto.bankName || adapter.getBankName(),
        accountNumber: dto.accountNumber || null,
        accountName: dto.accountName || null,
        accountType: "checking",
        lifecycleState: "pending_consent",
        lastSyncStatus: "pending",
        oauthState: state,
        providerConnectionId: startResult.providerConnectionId || null,
        syncError: null,
        providerErrorCode: null,
        providerErrorMessage: null,
      },
    });

    return {
      connectionId: connection.id,
      redirectUrl: startResult.authorizationUrl,
      state,
      lifecycleState: connection.lifecycleState,
    };
  }

  async handleCallback(userId: string, dto: BankConnectionCallbackDto) {
    const connection = await this.prisma.bankConnection.findFirst({
      where: {
        userId,
        bankCode: dto.bankCode,
        oauthState: dto.state,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!connection) {
      throw new BadRequestException(
        "Banka bağlantı state bilgisi doğrulanamadı."
      );
    }

    const adapter = this.getAdapter(connection.bankCode);

    if (dto.error) {
      const normalized = adapter.normalizeProviderError({
        providerCode: dto.error,
        providerMessage: dto.error_description || dto.error,
      });
      await this.persistConnectionError(connection.id, normalized);
      throw new BadRequestException(normalized.message);
    }

    if (!dto.code) {
      throw new BadRequestException("Banka callback kodu eksik.");
    }

    const tokenResult = await adapter.exchangeAuthorizationCode({
      code: dto.code,
      redirectUri: this.getConnectionRedirectUri(),
    });

    if (!tokenResult.success || !tokenResult.credentials) {
      const normalized =
        tokenResult.error || adapter.normalizeProviderError(tokenResult.error);
      await this.persistConnectionError(connection.id, normalized);
      throw new BadRequestException(normalized.message);
    }

    const account = this.pickPrimaryAccount(
      tokenResult.accounts || [],
      connection.accountNumber || undefined
    );

    const updated = await this.prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: this.encryptIfPresent(tokenResult.credentials.accessToken),
        refreshToken: this.encryptIfPresent(
          tokenResult.credentials.refreshToken
        ),
        expiresAt: tokenResult.credentials.expiresAt || null,
        accountNumber: account?.accountNumber || connection.accountNumber,
        accountName: account?.accountName || connection.accountName,
        accountType: account?.accountType || connection.accountType,
        oauthState: null,
        lifecycleState: "connected",
        lastConsentAt: new Date(),
        syncError: null,
        providerErrorCode: null,
        providerErrorMessage: null,
        connectionMetadata: JSON.stringify(
          this.mergeMetadata(connection.connectionMetadata, {
            simulation:
              tokenResult.credentials.metadata?.simulation === true,
            accountCount: tokenResult.accounts?.length || 0,
          })
        ),
      },
    });

    return this.mapConnection(updated);
  }

  async reconnect(userId: string, id: string) {
    const connection = await this.findOneRecord(userId, id);
    const adapter = this.getAdapter(connection.bankCode);
    const state = randomUUID();
    const redirectUri = this.getConnectionRedirectUri();
    const startResult = await adapter.startConnection({
      state,
      redirectUri,
      reconnect: true,
    });

    if (!startResult.success || !startResult.authorizationUrl) {
      throw new BadRequestException(
        startResult.error?.message || "Yeniden doğrulama başlatılamadı."
      );
    }

    await this.prisma.bankConnection.update({
      where: { id },
      data: {
        oauthState: state,
        lifecycleState: "pending_consent",
        providerConnectionId: startResult.providerConnectionId || null,
        syncError: null,
        providerErrorCode: null,
        providerErrorMessage: null,
      },
    });

    return {
      connectionId: id,
      redirectUrl: startResult.authorizationUrl,
      state,
      lifecycleState: "pending_consent",
    };
  }

  async findAll(userId: string) {
    const connections = await this.prisma.bankConnection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return connections.map((connection) => this.mapConnection(connection));
  }

  async findOne(userId: string, id: string) {
    const connection = await this.findOneRecord(userId, id);
    return this.mapConnection(connection);
  }

  async update(userId: string, id: string, dto: UpdateBankConnectionDto) {
    await this.findOneRecord(userId, id);
    const updated = await this.prisma.bankConnection.update({
      where: { id },
      data: {
        accountName: dto.accountName,
        accessToken: dto.accessToken
          ? this.encryptIfPresent(dto.accessToken)
          : undefined,
        refreshToken: dto.refreshToken
          ? this.encryptIfPresent(dto.refreshToken)
          : undefined,
        isActive: dto.isActive,
      },
    });

    return this.mapConnection(updated);
  }

  async remove(userId: string, id: string) {
    await this.findOneRecord(userId, id);
    return this.prisma.bankConnection.delete({
      where: { id },
    });
  }

  async syncTransactions(userId: string, connectionId: string) {
    const connection = await this.findOneRecord(userId, connectionId);

    if (connection.lifecycleState === "pending_consent") {
      throw new BadRequestException(
        "Bağlantı henüz kullanıcı onayını tamamlamadı."
      );
    }

    if (connection.lifecycleState === "reauth_required") {
      throw new BadRequestException(
        "Banka bağlantısı için yeniden doğrulama gerekiyor."
      );
    }

    const adapter = this.getAdapter(connection.bankCode);
    let credentials = this.buildCredentialsFromConnection(connection);
    credentials = await this.ensureFreshCredentials(connection, adapter, credentials);

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    let fetchResult = await adapter.getTransactions(
      connection.accountNumber || connection.providerConnectionId || "default",
      fromDate,
      toDate,
      credentials
    );

    if (
      !fetchResult.success &&
      fetchResult.error?.reauthRequired &&
      credentials.refreshToken
    ) {
      credentials = await this.refreshCredentials(
        connection,
        adapter,
        credentials
      );
      fetchResult = await adapter.getTransactions(
        connection.accountNumber || connection.providerConnectionId || "default",
        fromDate,
        toDate,
        credentials
      );
    }

    if (!fetchResult.success) {
      await this.persistConnectionError(
        connectionId,
        fetchResult.error || {
          code: "sync_failed",
          message: "Banka hareketleri alınamadı.",
        }
      );
      throw new BadRequestException(
        fetchResult.error?.message || "Senkronizasyon başarısız."
      );
    }

    if (fetchResult.refreshedCredentials) {
      await this.persistCredentials(connectionId, fetchResult.refreshedCredentials);
    }

    const createdTransactions = await this.importTransactions(
      userId,
      connection.bankCode,
      fetchResult.transactions || []
    );

    const updatedConnection = await this.prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        syncError: null,
        lifecycleState: "connected",
        providerErrorCode: null,
        providerErrorMessage: null,
      },
    });

    await this.notifySyncEvents(userId, connection.bankCode, createdTransactions);

    return {
      syncedCount: createdTransactions.length,
      connection: this.mapConnection(updatedConnection),
    };
  }

  async getAvailableBanks() {
    return Array.from(this.adapters.values()).map((adapter) => ({
        code: adapter.getBankCode(),
        name: adapter.getBankName(),
        isDemo: adapter.isDemoProvider(),
      }));
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

  private async findOneRecord(userId: string, id: string) {
    const connection = await this.prisma.bankConnection.findFirst({
      where: { id, userId },
    });

    if (!connection) {
      throw new NotFoundException("Bank connection not found");
    }

    return connection;
  }

  private buildCredentialsFromInput(dto: {
    accessToken?: string;
    refreshToken?: string;
  }): BankConnectionCredentials {
    return {
      accessToken: dto.accessToken || null,
      refreshToken: dto.refreshToken || null,
      expiresAt: null,
    };
  }

  private buildCredentialsFromConnection(connection: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
    connectionMetadata?: string | null;
  }): BankConnectionCredentials {
    return {
      accessToken: this.decryptIfPresent(connection.accessToken),
      refreshToken: this.decryptIfPresent(connection.refreshToken),
      expiresAt: connection.expiresAt,
      metadata: this.parseMetadata(connection.connectionMetadata),
    };
  }

  private async ensureFreshCredentials(
    connection: NonNullable<ConnectionRecord>,
    adapter: IBankAdapter,
    credentials: BankConnectionCredentials
  ) {
    const expiresAt = credentials.expiresAt?.getTime();
    const shouldRefresh =
      !credentials.accessToken ||
      (expiresAt !== undefined && expiresAt !== null
        ? expiresAt <= Date.now() + 2 * 60 * 1000
        : false);

    if (!shouldRefresh) {
      return credentials;
    }

    return this.refreshCredentials(connection, adapter, credentials);
  }

  private async refreshCredentials(
    connection: NonNullable<ConnectionRecord>,
    adapter: IBankAdapter,
    credentials: BankConnectionCredentials
  ) {
    const refreshResult = await adapter.refreshAccessToken(credentials);
    if (!refreshResult.success || !refreshResult.credentials) {
      const normalized =
        refreshResult.error || adapter.normalizeProviderError(refreshResult.error);
      await this.persistConnectionError(connection.id, normalized);
      throw new BadRequestException(normalized.message);
    }

    await this.persistCredentials(connection.id, refreshResult.credentials);
    return refreshResult.credentials;
  }

  private async persistCredentials(
    connectionId: string,
    credentials: BankConnectionCredentials
  ) {
    await this.prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: this.encryptIfPresent(credentials.accessToken),
        refreshToken: this.encryptIfPresent(credentials.refreshToken),
        expiresAt: credentials.expiresAt || null,
        lifecycleState: "connected",
        providerErrorCode: null,
        providerErrorMessage: null,
        syncError: null,
      },
    });
  }

  private async persistConnectionError(
    connectionId: string,
    error: NormalizedBankError
  ) {
    const lifecycleState: BankLifecycleState = error.reauthRequired
      ? "reauth_required"
      : "failed";
    const lastSyncStatus: BankSyncStatus = error.reauthRequired
      ? "reauth_required"
      : "failed";

    await this.prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus,
        lifecycleState,
        syncError: error.message,
        providerErrorCode: error.code,
        providerErrorMessage: error.detail || error.message,
        reauthRequiredAt: error.reauthRequired ? new Date() : null,
      },
    });
  }

  private pickPrimaryAccount(
    accounts: Array<{
      accountNumber: string;
      accountName: string;
      accountType: "checking" | "savings" | "credit";
    }>,
    preferredAccountNumber?: string
  ) {
    if (!accounts.length) {
      return null;
    }

    return (
      accounts.find(
        (account) => preferredAccountNumber && account.accountNumber === preferredAccountNumber
      ) || accounts[0]
    );
  }

  private mapConnection(connection: NonNullable<ConnectionRecord>) {
    return {
      id: connection.id,
      userId: connection.userId,
      bankCode: connection.bankCode,
      bankName: connection.bankName,
      accountNumber: connection.accountNumber || undefined,
      accountName: connection.accountName || undefined,
      accountType: connection.accountType,
      expiresAt: connection.expiresAt?.toISOString(),
      lastSyncAt: connection.lastSyncAt?.toISOString(),
      lastSyncStatus: connection.lastSyncStatus,
      lifecycleState: connection.lifecycleState,
      syncError: connection.syncError || undefined,
      errorReason:
        connection.providerErrorMessage || connection.syncError || undefined,
      providerErrorCode: connection.providerErrorCode || undefined,
      lastConsentAt: connection.lastConsentAt?.toISOString(),
      reauthRequiredAt: connection.reauthRequiredAt?.toISOString(),
      isActive: connection.isActive,
      isDemoProvider: this.getAdapter(connection.bankCode).isDemoProvider(),
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    };
  }

  private encryptIfPresent(value?: string | null) {
    return value ? this.encryption.encrypt(value) : null;
  }

  private decryptIfPresent(value?: string | null) {
    return value ? this.encryption.decrypt(value) : null;
  }

  private getConnectionRedirectUri() {
    return `${getFrontendBaseUrl()}/bank-connections`;
  }

  private parseMetadata(raw?: string | null): Record<string, unknown> {
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private mergeMetadata(
    raw: string | null | undefined,
    next: Record<string, unknown>
  ) {
    return {
      ...this.parseMetadata(raw),
      ...next,
    };
  }

  private async importTransactions(
    userId: string,
    bankCode: string,
    bankTransactions: BankTransaction[]
  ): Promise<Transaction[]> {
    const created: Transaction[] = [];

    for (const tx of bankTransactions) {
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
        continue;
      }

      const category = this.mapCategory(tx.category, tx.type);
      const ownerContext = await this.resolveHouseholdContext(userId, 90);

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
          tags: "[]",
          confidence: 90,
          householdId: ownerContext.householdId,
          ownerUserId: ownerContext.ownerUserId,
          reviewerUserId: ownerContext.reviewerUserId,
          needsReview: ownerContext.needsReview,
        },
      });

      if (newTx) {
        created.push(newTx);
      }
    }

    return created;
  }

  private async notifySyncEvents(
    userId: string,
    bankCode: string,
    transactions: Transaction[]
  ) {
    const createdTransactions = transactions.filter(
      (transaction): transaction is Transaction => !!transaction
    );

    this.realtime.notifySync(userId, {
      source: `bank:${bankCode}`,
      imported: createdTransactions.length,
      timestamp: new Date(),
    });

    for (const transaction of createdTransactions) {
      this.realtime.notifyNewTransaction(transaction.ownerUserId || userId, {
        id: transaction.id,
        description: transaction.description,
        amount: Number(transaction.amount),
        type: transaction.type as "income" | "expense",
        categoryLabel: transaction.categoryLabel,
      });

      if (transaction.needsReview && transaction.reviewerUserId) {
        this.realtime.notifyReviewRequested([transaction.reviewerUserId], {
          transactionId: transaction.id,
          householdId: transaction.householdId || undefined,
          ownerUserId: transaction.ownerUserId || userId,
          reviewerUserId: transaction.reviewerUserId,
          needsReview: true,
        });
      }
    }

    const householdIds = Array.from(
      new Set(
        createdTransactions
          .map((transaction) => transaction.householdId)
          .filter((householdId): householdId is string => !!householdId)
      )
    );

    if (householdIds.length === 0) {
      return;
    }

    const memberships = await this.prisma.householdMember.findMany({
      where: {
        householdId: { in: householdIds },
      },
      select: {
        householdId: true,
        userId: true,
      },
    });

    for (const householdId of householdIds) {
      const memberUserIds = memberships
        .filter((membership) => membership.householdId === householdId)
        .map((membership) => membership.userId);

      if (memberUserIds.length === 0) {
        continue;
      }

      const imported = transactions.filter(
        (transaction) => !!transaction && transaction.householdId === householdId
      ).length;

      this.realtime.notifyHouseholdUpdated(memberUserIds, {
        householdId,
        event: "transactions_synced",
        source: `bank:${bankCode}`,
        imported,
      });
    }
  }

  private async resolveHouseholdContext(userId: string, confidence: number) {
    const membership = await this.prisma.householdMember.findFirst({
      where: { userId },
      include: {
        household: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!membership) {
      return {
        householdId: null,
        ownerUserId: userId,
        reviewerUserId: null,
        needsReview: false,
      };
    }

    const reviewerUserId =
      confidence < 70 && membership.household.ownerId !== userId
        ? membership.household.ownerId
        : null;

    return {
      householdId: membership.household.id,
      ownerUserId: userId,
      reviewerUserId,
      needsReview: confidence < 70 && !!reviewerUserId,
    };
  }

  private mapCategory(
    category: string | undefined,
    type: string
  ): { id: string; label: string } {
    const categoryMap: Record<string, { id: string; label: string }> = {
      market: { id: "market", label: "Market" },
      ulasim: { id: "ulasim", label: "Ulaşım" },
      yemek: { id: "yemek", label: "Yemek" },
      abonelik: { id: "abonelik", label: "Abonelik" },
      fatura: { id: "fatura", label: "Faturalar" },
      alisveris: { id: "alisveris", label: "Alışveriş" },
      saglik: { id: "saglik", label: "Sağlık" },
      maas: { id: "maas", label: "Maaş" },
      freelance: { id: "freelance", label: "Freelance" },
      kira_geliri: { id: "kira_geliri", label: "Kira Geliri" },
      yatirim: { id: "yatirim", label: "Yatırım Geliri" },
    };

    if (category && categoryMap[category]) {
      return categoryMap[category];
    }

    return type === "income"
      ? { id: "diger_gelir", label: "Diğer Gelir" }
      : { id: "diger", label: "Diğer" };
  }
}
