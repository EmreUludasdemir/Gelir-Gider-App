import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma.service'
import * as crypto from 'crypto'
import { RealtimeGateway } from '../realtime/realtime.gateway'

const HOUSEHOLD_MANAGER_ROLES = new Set(['owner', 'admin'])
const HOUSEHOLD_MEMBER_ROLES = new Set(['owner', 'admin', 'member', 'viewer'])
const HOUSEHOLD_INVITE_ROLES = new Set(['member', 'viewer'])
const ACTIVE_HOUSEHOLD_INCLUDE = {
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  sharedBudgets: true,
  invites: {
    where: { expiresAt: { gt: new Date() }, usedAt: null },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.HouseholdInclude

@Injectable()
export class HouseholdsService {
  constructor(
    private prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(userId: string, name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Household name is required')
    }

    const household = await this.prisma.household.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: ACTIVE_HOUSEHOLD_INCLUDE,
    })

    this.realtime.notifyHouseholdUpdated([userId], {
      householdId: household.id,
      event: 'created',
      name: household.name,
    })

    return household
  }

  async findAll(userId: string) {
    return this.prisma.household.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        ...ACTIVE_HOUSEHOLD_INCLUDE,
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findOne(userId: string, id: string) {
    const household = await this.prisma.household.findFirst({
      where: {
        id,
        members: { some: { userId } },
      },
      include: ACTIVE_HOUSEHOLD_INCLUDE,
    })

    if (!household) {
      throw new NotFoundException('Household not found')
    }

    return household
  }

  async update(userId: string, id: string, name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Household name is required')
    }

    const household = await this.findOne(userId, id)
    this.ensureManagerAccess(household.members, userId, 'Only owner or admin can update household')

    const updated = await this.prisma.household.update({
      where: { id },
      data: { name: name.trim() },
      include: ACTIVE_HOUSEHOLD_INCLUDE,
    })

    await this.notifyHouseholdMembers(updated.id, 'updated', {
      householdId: updated.id,
      name: updated.name,
    })

    return updated
  }

  async remove(userId: string, id: string) {
    const household = await this.findOne(userId, id)

    if (household.ownerId !== userId) {
      throw new ForbiddenException('Only owner can delete household')
    }

    const memberUserIds = household.members.map((member) => member.userId)
    const removed = await this.prisma.household.delete({ where: { id } })

    this.realtime.notifyHouseholdUpdated(memberUserIds, {
      householdId: id,
      event: 'deleted',
    })

    return removed
  }

  async createInvite(
    userId: string,
    householdId: string,
    email?: string,
    role: 'member' | 'viewer' = 'member',
  ) {
    if (!HOUSEHOLD_INVITE_ROLES.has(role)) {
      throw new BadRequestException('Invalid invite role')
    }

    const household = await this.findOne(userId, householdId)
    this.ensureManagerAccess(household.members, userId, 'Only owner or admin can create invites')

    const code = crypto.randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invite = await this.prisma.householdInvite.create({
      data: {
        householdId,
        code,
        email,
        role,
        expiresAt,
      },
    })

    await this.notifyHouseholdMembers(householdId, 'invite_created', {
      householdId,
      inviteId: invite.id,
      role,
    })

    return invite
  }

  async joinByCode(userId: string, code: string) {
    const invite = await this.prisma.householdInvite.findFirst({
      where: {
        code,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: {
        household: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    })

    if (!invite) {
      throw new BadRequestException('Invalid or expired invite code')
    }

    const existingMember = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId: invite.householdId,
          userId,
        },
      },
    })

    if (existingMember) {
      throw new BadRequestException('Already a member of this household')
    }

    const [, member] = await this.prisma.$transaction([
      this.prisma.householdInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), usedBy: userId },
      }),
      this.prisma.householdMember.create({
        data: {
          householdId: invite.householdId,
          userId,
          role: invite.role,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          household: {
            include: {
              members: {
                include: { user: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
      }),
    ])

    await this.notifyHouseholdMembers(invite.householdId, 'invite_accepted', {
      householdId: invite.householdId,
      memberUserId: userId,
      role: invite.role,
    })

    return member
  }

  async leave(userId: string, householdId: string) {
    const household = await this.findOne(userId, householdId)

    if (household.ownerId === userId) {
      throw new BadRequestException('Owner cannot leave. Transfer ownership or delete the household.')
    }

    await this.prisma.householdMember.delete({
      where: {
        householdId_userId: { householdId, userId },
      },
    })

    await this.notifyHouseholdMembers(householdId, 'member_left', {
      householdId,
      memberUserId: userId,
    })

    return { success: true }
  }

  async removeMember(userId: string, householdId: string, memberId: string) {
    const household = await this.findOne(userId, householdId)
    this.ensureManagerAccess(household.members, userId, 'Only owner or admin can remove members')

    const targetMember = household.members.find((member) => member.userId === memberId)
    if (!targetMember) {
      throw new NotFoundException('Member not found')
    }

    if (targetMember.role === 'owner') {
      throw new ForbiddenException('Cannot remove owner')
    }

    await this.prisma.householdMember.delete({
      where: {
        householdId_userId: { householdId, userId: memberId },
      },
    })

    await this.notifyHouseholdMembers(householdId, 'member_removed', {
      householdId,
      memberUserId: memberId,
    })

    return { success: true }
  }

  async updateMemberRole(
    userId: string,
    householdId: string,
    memberId: string,
    role: string
  ) {
    if (!HOUSEHOLD_MEMBER_ROLES.has(role) || role === 'owner') {
      throw new BadRequestException('Invalid role')
    }

    const household = await this.findOne(userId, householdId)

    if (household.ownerId !== userId) {
      throw new ForbiddenException('Only owner can change roles')
    }

    const targetMember = household.members.find((member) => member.userId === memberId)
    if (!targetMember) {
      throw new NotFoundException('Member not found')
    }

    if (targetMember.role === 'owner') {
      throw new ForbiddenException('Owner role cannot be changed')
    }

    const updated = await this.prisma.householdMember.update({
      where: {
        householdId_userId: { householdId, userId: memberId },
      },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    await this.notifyHouseholdMembers(householdId, 'role_updated', {
      householdId,
      memberUserId: memberId,
      role,
    })

    return updated
  }

  async createSharedBudget(
    userId: string,
    householdId: string,
    data: { categoryId: string; categoryLabel: string; limitAmount: number; period?: string }
  ) {
    const household = await this.findOne(userId, householdId)
    this.ensureManagerAccess(household.members, userId, 'Only owner or admin can create shared budgets')

    return this.prisma.householdBudget.create({
      data: {
        householdId,
        categoryId: data.categoryId,
        categoryLabel: data.categoryLabel,
        limitAmount: data.limitAmount,
        period: data.period || 'monthly',
      },
    })
  }

  async getSharedBudgets(userId: string, householdId: string) {
    await this.findOne(userId, householdId)

    return this.prisma.householdBudget.findMany({
      where: { householdId, isActive: true },
    })
  }

  async deleteSharedBudget(userId: string, householdId: string, budgetId: string) {
    const household = await this.findOne(userId, householdId)
    this.ensureManagerAccess(household.members, userId, 'Only owner or admin can delete shared budgets')

    return this.prisma.householdBudget.delete({
      where: { id: budgetId },
    })
  }

  private ensureManagerAccess(
    members: Array<{ userId: string; role: string }>,
    userId: string,
    message: string,
  ) {
    const member = members.find((candidate) => candidate.userId === userId)
    if (!member || !HOUSEHOLD_MANAGER_ROLES.has(member.role)) {
      throw new ForbiddenException(message)
    }
  }

  private async notifyHouseholdMembers(
    householdId: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      select: { userId: true },
    })

    const userIds = Array.from(new Set(members.map((member) => member.userId)))
    if (userIds.length === 0) {
      return
    }

    this.realtime.notifyHouseholdUpdated(userIds, {
      householdId,
      event,
      ...payload,
    })
  }
}
