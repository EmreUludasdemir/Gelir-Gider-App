import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { HouseholdsService } from './households.service'
import { PrismaService } from '../../prisma.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { createMockPrismaService } from '../../../test/test-utils'

describe('HouseholdsService', () => {
  let service: HouseholdsService
  let prisma: ReturnType<typeof createMockPrismaService>
  let realtime: { notifyHouseholdUpdated: jest.Mock }

  const ownerId = 'user-owner'
  const memberId = 'user-member'
  const householdId = 'household-1'

  const baseMembers = [
    {
      userId: ownerId,
      role: 'owner',
      user: {
        id: ownerId,
        email: 'owner@example.com',
        name: 'Owner',
      },
    },
    {
      userId: memberId,
      role: 'member',
      user: {
        id: memberId,
        email: 'member@example.com',
        name: 'Member',
      },
    },
  ]

  const householdRecord = {
    id: householdId,
    name: 'Ev',
    ownerId,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    members: baseMembers,
    invites: [],
    sharedBudgets: [],
  }

  beforeEach(async () => {
    prisma = createMockPrismaService()
    realtime = {
      notifyHouseholdUpdated: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeGateway, useValue: realtime },
      ],
    }).compile()

    service = module.get<HouseholdsService>(HouseholdsService)
    jest.clearAllMocks()
  })

  describe('createInvite', () => {
    it('rejects unsupported invite roles', async () => {
      await expect(
        service.createInvite(ownerId, householdId, 'viewer@example.com', 'admin' as 'member')
      ).rejects.toThrow(BadRequestException)
    })

    it('creates viewer invite and notifies household members', async () => {
      prisma.household.findFirst.mockResolvedValue(householdRecord)
      prisma.householdInvite.create.mockResolvedValue({
        id: 'invite-1',
        householdId,
        code: 'invite-code',
        email: 'viewer@example.com',
        role: 'viewer',
        expiresAt: new Date('2026-04-01T00:00:00.000Z'),
        usedAt: null,
        usedBy: null,
        createdAt: new Date('2026-03-20T00:00:00.000Z'),
      })
      prisma.householdMember.findMany.mockResolvedValue([
        { userId: ownerId },
        { userId: memberId },
      ])

      const invite = await service.createInvite(
        ownerId,
        householdId,
        'viewer@example.com',
        'viewer'
      )

      expect(invite.role).toBe('viewer')
      expect(prisma.householdInvite.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          householdId,
          email: 'viewer@example.com',
          role: 'viewer',
        }),
      })
      expect(realtime.notifyHouseholdUpdated).toHaveBeenCalledWith(
        [ownerId, memberId],
        expect.objectContaining({
          householdId,
          event: 'invite_created',
          role: 'viewer',
        })
      )
    })
  })

  describe('joinByCode', () => {
    it('applies invite role when creating the member', async () => {
      prisma.householdInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        householdId,
        code: 'viewer-code',
        email: null,
        role: 'viewer',
        expiresAt: new Date('2026-04-01T00:00:00.000Z'),
        usedAt: null,
        usedBy: null,
        createdAt: new Date('2026-03-20T00:00:00.000Z'),
        household: householdRecord,
      })
      prisma.householdMember.findUnique.mockResolvedValue(null)
      prisma.householdInvite.update.mockResolvedValue({})
      prisma.householdMember.create.mockResolvedValue({
        id: 'member-join-1',
        householdId,
        userId: 'user-viewer',
        role: 'viewer',
        joinedAt: new Date('2026-03-21T00:00:00.000Z'),
        user: {
          id: 'user-viewer',
          email: 'viewer@example.com',
          name: 'Viewer',
        },
        household: householdRecord,
      })
      prisma.$transaction.mockImplementation(async (operations) => Promise.all(operations))
      prisma.householdMember.findMany.mockResolvedValue([
        { userId: ownerId },
        { userId: memberId },
        { userId: 'user-viewer' },
      ])

      const result = await service.joinByCode('user-viewer', 'viewer-code')

      expect(result.role).toBe('viewer')
      expect(prisma.householdMember.create).toHaveBeenCalledWith({
        data: {
          householdId,
          userId: 'user-viewer',
          role: 'viewer',
        },
        include: expect.any(Object),
      })
      expect(realtime.notifyHouseholdUpdated).toHaveBeenCalledWith(
        [ownerId, memberId, 'user-viewer'],
        expect.objectContaining({
          householdId,
          event: 'invite_accepted',
          memberUserId: 'user-viewer',
          role: 'viewer',
        })
      )
    })
  })

  describe('updateMemberRole', () => {
    it('allows owner to promote member to viewer', async () => {
      prisma.household.findFirst.mockResolvedValue(householdRecord)
      prisma.householdMember.update.mockResolvedValue({
        householdId,
        userId: memberId,
        role: 'viewer',
        joinedAt: new Date('2026-03-02T00:00:00.000Z'),
        user: {
          id: memberId,
          email: 'member@example.com',
          name: 'Member',
        },
      })
      prisma.householdMember.findMany.mockResolvedValue([
        { userId: ownerId },
        { userId: memberId },
      ])

      const updatedMember = await service.updateMemberRole(
        ownerId,
        householdId,
        memberId,
        'viewer'
      )

      expect(updatedMember.role).toBe('viewer')
      expect(prisma.householdMember.update).toHaveBeenCalledWith({
        where: {
          householdId_userId: { householdId, userId: memberId },
        },
        data: { role: 'viewer' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })
    })

    it('rejects role changes from non-owner users', async () => {
      prisma.household.findFirst.mockResolvedValue({
        ...householdRecord,
        members: [
          {
            userId: ownerId,
            role: 'owner',
            user: { id: ownerId, email: 'owner@example.com', name: 'Owner' },
          },
          {
            userId: memberId,
            role: 'admin',
            user: { id: memberId, email: 'member@example.com', name: 'Member' },
          },
        ],
      })

      await expect(
        service.updateMemberRole(memberId, householdId, ownerId, 'viewer')
      ).rejects.toThrow(ForbiddenException)
    })
  })
})
