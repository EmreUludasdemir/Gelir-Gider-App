import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        success: entry.success ?? true,
      },
    });
  }

  // Predefined logging methods
  async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    success = true
  ): Promise<void> {
    await this.log({
      userId,
      action: "login",
      entity: "user",
      entityId: userId,
      ipAddress,
      userAgent,
      success,
    });
  }

  async logLogout(userId: string): Promise<void> {
    await this.log({
      userId,
      action: "logout",
      entity: "user",
      entityId: userId,
    });
  }

  async logPasswordChange(userId: string, ipAddress?: string): Promise<void> {
    await this.log({
      userId,
      action: "password_change",
      entity: "user",
      entityId: userId,
      ipAddress,
    });
  }

  async log2FAEnabled(userId: string): Promise<void> {
    await this.log({
      userId,
      action: "2fa_enabled",
      entity: "user",
      entityId: userId,
    });
  }

  async log2FADisabled(userId: string): Promise<void> {
    await this.log({
      userId,
      action: "2fa_disabled",
      entity: "user",
      entityId: userId,
    });
  }

  async logTransactionCreate(
    userId: string,
    transactionId: string,
    amount: number
  ): Promise<void> {
    await this.log({
      userId,
      action: "transaction_create",
      entity: "transaction",
      entityId: transactionId,
      details: { amount },
    });
  }

  async logTransactionDelete(
    userId: string,
    transactionId: string
  ): Promise<void> {
    await this.log({
      userId,
      action: "transaction_delete",
      entity: "transaction",
      entityId: transactionId,
    });
  }

  async logBudgetCreate(
    userId: string,
    budgetId: string,
    category: string
  ): Promise<void> {
    await this.log({
      userId,
      action: "budget_create",
      entity: "budget",
      entityId: budgetId,
      details: { category },
    });
  }

  async logSavingsGoalCreate(
    userId: string,
    goalId: string,
    name: string
  ): Promise<void> {
    await this.log({
      userId,
      action: "savings_goal_create",
      entity: "savings_goal",
      entityId: goalId,
      details: { name },
    });
  }

  // Query methods
  async getRecentLogs(userId: string, limit = 50): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getLoginHistory(userId: string, limit = 20): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
        action: "login",
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getSecurityEvents(userId: string): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
        action: {
          in: ["login", "password_change", "2fa_enabled", "2fa_disabled"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getFailedLoginAttempts(userId: string, since: Date): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        userId,
        action: "login",
        success: false,
        createdAt: { gte: since },
      },
    });
  }
}
