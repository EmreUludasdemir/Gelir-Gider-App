import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDebtDto, UpdateDebtDto, DebtQueryDto } from './dto/debt.dto';

@Injectable()
export class DebtsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateDebtDto) {
        return this.prisma.debt.create({
            data: {
                userId,
                personName: dto.personName,
                amount: dto.amount,
                currency: dto.currency || 'TRY',
                type: dto.type,
                description: dto.description,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
            },
        });
    }

    async findAll(userId: string, query: Partial<DebtQueryDto> = {}) {
        const { page = 1, limit = 20, type, isPaid } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.DebtWhereInput = { userId };
        if (type) where.type = type;
        if (isPaid !== undefined) where.isPaid = isPaid;

        const [debts, total] = await Promise.all([
            this.prisma.debt.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.debt.count({ where }),
        ]);

        return {
            data: debts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(userId: string, id: string) {
        const debt = await this.prisma.debt.findFirst({
            where: { id, userId },
        });

        if (!debt) {
            throw new NotFoundException(`Debt with ID ${id} not found`);
        }

        return debt;
    }

    async update(userId: string, id: string, dto: UpdateDebtDto) {
        await this.findOne(userId, id);

        const updateData: Prisma.DebtUpdateInput = {};
        if (dto.personName) updateData.personName = dto.personName;
        if (dto.amount !== undefined) updateData.amount = dto.amount;
        if (dto.type) updateData.type = dto.type;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.dueDate !== undefined) {
            updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        }
        if (dto.isPaid !== undefined) updateData.isPaid = dto.isPaid;

        return this.prisma.debt.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(userId: string, id: string) {
        await this.findOne(userId, id);

        return this.prisma.debt.delete({
            where: { id },
        });
    }

    async markAsPaid(userId: string, id: string) {
        await this.findOne(userId, id);

        return this.prisma.debt.update({
            where: { id },
            data: {
                isPaid: true,
                paidAt: new Date(),
            },
        });
    }

    async getSummary(userId: string) {
        const [owedToMe, iOwe, totalDebts] = await Promise.all([
            this.prisma.debt.aggregate({
                where: {
                    userId,
                    type: 'owed_to_me',
                    isPaid: false,
                },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.debt.aggregate({
                where: {
                    userId,
                    type: 'i_owe',
                    isPaid: false,
                },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.debt.count({ where: { userId } }),
        ]);

        const netBalance = (owedToMe._sum.amount || 0) - (iOwe._sum.amount || 0);

        return {
            owedToMe: {
                total: owedToMe._sum.amount || 0,
                count: owedToMe._count,
            },
            iOwe: {
                total: iOwe._sum.amount || 0,
                count: iOwe._count,
            },
            netBalance,
            totalDebts,
        };
    }
}
