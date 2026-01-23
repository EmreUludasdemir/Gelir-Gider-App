import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  planDistribution: { planName: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

export interface UserWithPlan {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  plan: {
    name: string;
    displayName: string;
    status: string;
  } | null;
  transactionCount: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  // Admin email listesi - production'da env'den alınmalı
  private readonly adminEmails = [
    'admin@example.com',
    'demo@example.com', // Demo için
  ];

  constructor(private prisma: PrismaService) {}

  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user ? this.adminEmails.includes(user.email) : false;
  }

  async verifyAdmin(userId: string): Promise<void> {
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin yetkisi gerekli');
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Paralel sorgular
    const [
      totalUsers,
      newUsersThisMonth,
      activeSubscriptions,
      planDistribution,
      revenueData,
    ] = await Promise.all([
      // Toplam kullanıcı
      this.prisma.user.count(),

      // Bu ay yeni kullanıcılar
      this.prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Aktif abonelikler (free hariç)
      this.prisma.userPlan.count({
        where: {
          status: 'active',
          plan: { name: { not: 'free' } },
        },
      }),

      // Plan dağılımı
      this.prisma.userPlan.groupBy({
        by: ['planId'],
        _count: { planId: true },
      }),

      // Gelir verisi (son 6 ay)
      this.prisma.paymentHistory.findMany({
        where: {
          status: 'succeeded',
          paidAt: { gte: sixMonthsAgo },
        },
        select: {
          amount: true,
          paidAt: true,
        },
      }),
    ]);

    // Plan isimlerini getir
    const plans = await this.prisma.plan.findMany();
    const planMap = new Map(plans.map((p) => [p.id, p.displayName]));

    const planDist = planDistribution.map((pd) => ({
      planName: planMap.get(pd.planId) || 'Bilinmeyen',
      count: pd._count.planId,
    }));

    // Aylık gelir hesapla
    const revenueByMonth = this.calculateMonthlyRevenue(revenueData);

    // Toplam gelir
    const totalRevenue = revenueData.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalUsers,
      activeSubscriptions,
      totalRevenue,
      newUsersThisMonth,
      planDistribution: planDist,
      revenueByMonth,
    };
  }

  private calculateMonthlyRevenue(
    payments: { amount: number; paidAt: Date | null }[],
  ): { month: string; revenue: number }[] {
    const months: Map<string, number> = new Map();

    // Son 6 ayı başlat
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.set(key, 0);
    }

    // Ödemeleri ekle
    for (const payment of payments) {
      if (payment.paidAt) {
        const date = new Date(payment.paidAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (months.has(key)) {
          months.set(key, (months.get(key) || 0) + payment.amount);
        }
      }
    }

    return Array.from(months.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }

  async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<{ users: UserWithPlan[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: { select: { transactions: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Kullanıcıların planlarını getir
    const userIds = users.map((u) => u.id);
    const userPlans = await this.prisma.userPlan.findMany({
      where: { userId: { in: userIds } },
      include: { plan: { select: { name: true, displayName: true } } },
    });

    const planMap = new Map(
      userPlans.map((up) => [
        up.userId,
        {
          name: up.plan.name,
          displayName: up.plan.displayName,
          status: up.status,
        },
      ]),
    );

    const usersWithPlan: UserWithPlan[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      plan: planMap.get(u.id) || null,
      transactionCount: u._count.transactions,
    }));

    return {
      users: usersWithPlan,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getSubscriptions(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<{
    subscriptions: any[];
    total: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const where = {
      plan: { name: { not: 'free' } },
      ...(status && { status }),
    };

    const [subscriptions, total] = await Promise.all([
      this.prisma.userPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          plan: { select: { name: true, displayName: true, priceMonthly: true } },
        },
      }),
      this.prisma.userPlan.count({ where }),
    ]);

    // Kullanıcı bilgilerini getir
    const userIds = subscriptions.map((s) => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const subsWithUser = subscriptions.map((s) => ({
      id: s.id,
      user: userMap.get(s.userId),
      plan: s.plan,
      status: s.status,
      billingCycle: s.billingCycle,
      currentPeriodEnd: s.currentPeriodEnd,
      cancelAt: s.cancelAt,
      createdAt: s.createdAt,
    }));

    return {
      subscriptions: subsWithUser,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getRecentPayments(limit: number = 10) {
    const payments = await this.prisma.paymentHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        planName: true,
        createdAt: true,
        paidAt: true,
      },
    });

    // Kullanıcı bilgilerini getir
    const userIds = payments.map((p) => p.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.email]));

    return payments.map((p) => ({
      ...p,
      userEmail: userMap.get(p.userId) || 'Unknown',
    }));
  }
}
