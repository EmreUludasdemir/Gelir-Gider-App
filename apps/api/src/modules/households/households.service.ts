import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class HouseholdsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new household
   */
  async create(userId: string, name: string) {
    const household = await this.prisma.household.create({
      data: {
        name,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return household;
  }

  /**
   * Get all households for a user
   */
  async findAll(userId: string) {
    return this.prisma.household.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        sharedBudgets: true,
        _count: { select: { members: true } },
      },
    });
  }

  /**
   * Get a household by ID
   */
  async findOne(userId: string, id: string) {
    const household = await this.prisma.household.findFirst({
      where: {
        id,
        members: { some: { userId } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        sharedBudgets: true,
        invites: {
          where: { expiresAt: { gt: new Date() }, usedAt: null },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    return household;
  }

  /**
   * Update household name
   */
  async update(userId: string, id: string, name: string) {
    const household = await this.findOne(userId, id);
    
    // Only owner or admin can update
    const member = household.members.find((m) => m.userId === userId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new ForbiddenException('Only owner or admin can update household');
    }

    return this.prisma.household.update({
      where: { id },
      data: { name },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  /**
   * Delete a household
   */
  async remove(userId: string, id: string) {
    const household = await this.findOne(userId, id);
    
    if (household.ownerId !== userId) {
      throw new ForbiddenException('Only owner can delete household');
    }

    return this.prisma.household.delete({ where: { id } });
  }

  /**
   * Create an invite code
   */
  async createInvite(userId: string, householdId: string, email?: string) {
    const household = await this.findOne(userId, householdId);
    
    const member = household.members.find((m) => m.userId === userId);
    if (!member || member.role === 'member') {
      throw new ForbiddenException('Only owner or admin can create invites');
    }

    const code = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    return this.prisma.householdInvite.create({
      data: {
        householdId,
        code,
        email,
        expiresAt,
      },
    });
  }

  /**
   * Join a household using invite code
   */
  async joinByCode(userId: string, code: string) {
    const invite = await this.prisma.householdInvite.findFirst({
      where: {
        code,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { household: true },
    });

    if (!invite) {
      throw new BadRequestException('Invalid or expired invite code');
    }

    // Check if already a member
    const existingMember = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId: invite.householdId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('Already a member of this household');
    }

    // Mark invite as used and create membership
    const [, member] = await this.prisma.$transaction([
      this.prisma.householdInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), usedBy: userId },
      }),
      this.prisma.householdMember.create({
        data: {
          householdId: invite.householdId,
          userId,
          role: 'member',
        },
        include: {
          household: {
            include: { members: true },
          },
        },
      }),
    ]);

    return member;
  }

  /**
   * Leave a household
   */
  async leave(userId: string, householdId: string) {
    const household = await this.findOne(userId, householdId);

    if (household.ownerId === userId) {
      throw new BadRequestException('Owner cannot leave. Transfer ownership or delete the household.');
    }

    return this.prisma.householdMember.delete({
      where: {
        householdId_userId: { householdId, userId },
      },
    });
  }

  /**
   * Remove a member from household
   */
  async removeMember(userId: string, householdId: string, memberId: string) {
    const household = await this.findOne(userId, householdId);

    const currentMember = household.members.find((m) => m.userId === userId);
    if (!currentMember || currentMember.role === 'member') {
      throw new ForbiddenException('Only owner or admin can remove members');
    }

    const targetMember = household.members.find((m) => m.userId === memberId);
    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === 'owner') {
      throw new ForbiddenException('Cannot remove owner');
    }

    return this.prisma.householdMember.delete({
      where: {
        householdId_userId: { householdId, userId: memberId },
      },
    });
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    userId: string,
    householdId: string,
    memberId: string,
    role: string
  ) {
    const household = await this.findOne(userId, householdId);

    if (household.ownerId !== userId) {
      throw new ForbiddenException('Only owner can change roles');
    }

    if (!['admin', 'member'].includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    return this.prisma.householdMember.update({
      where: {
        householdId_userId: { householdId, userId: memberId },
      },
      data: { role },
    });
  }

  // ============================================
  // Shared Budgets
  // ============================================

  async createSharedBudget(
    userId: string,
    householdId: string,
    data: { categoryId: string; categoryLabel: string; limitAmount: number; period?: string }
  ) {
    const household = await this.findOne(userId, householdId);

    const member = household.members.find((m) => m.userId === userId);
    if (!member || member.role === 'member') {
      throw new ForbiddenException('Only owner or admin can create shared budgets');
    }

    return this.prisma.householdBudget.create({
      data: {
        householdId,
        categoryId: data.categoryId,
        categoryLabel: data.categoryLabel,
        limitAmount: data.limitAmount,
        period: data.period || 'monthly',
      },
    });
  }

  async getSharedBudgets(userId: string, householdId: string) {
    await this.findOne(userId, householdId); // Verify membership
    
    return this.prisma.householdBudget.findMany({
      where: { householdId, isActive: true },
    });
  }

  async deleteSharedBudget(userId: string, householdId: string, budgetId: string) {
    const household = await this.findOne(userId, householdId);

    const member = household.members.find((m) => m.userId === userId);
    if (!member || member.role === 'member') {
      throw new ForbiddenException('Only owner or admin can delete shared budgets');
    }

    return this.prisma.householdBudget.delete({
      where: { id: budgetId },
    });
  }
}
