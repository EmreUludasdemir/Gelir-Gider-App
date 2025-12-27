import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma, Bill } from '@prisma/client';
import { CreateBillDto, UpdateBillDto, BillQueryDto } from './dto/bill.dto';

@Injectable()
export class BillsService {
    private readonly logger = new Logger(BillsService.name);

    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateBillDto) {
        this.logger.log(`Creating bill for user ${userId}: ${dto.name}`);

        return this.prisma.bill.create({
            data: {
                userId,
                name: dto.name,
                amount: dto.amount,
                currency: dto.currency || 'TRY',
                dueDate: new Date(dto.dueDate),
                frequency: dto.frequency || 'monthly',
                categoryId: dto.categoryId,
                categoryLabel: dto.categoryLabel,
                reminderDays: dto.reminderDays || 3,
                notes: dto.notes,
            },
        });
    }

    async findAll(userId: string, query: Partial<BillQueryDto> = {}) {
        const { page = 1, limit = 20, isPaid } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.BillWhereInput = { userId };
        if (isPaid !== undefined) {
            where.isPaid = isPaid;
        }

        const [bills, total] = await Promise.all([
            this.prisma.bill.findMany({
                where,
                skip,
                take: limit,
                orderBy: { dueDate: 'asc' },
            }),
            this.prisma.bill.count({ where }),
        ]);

        return {
            data: bills,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(userId: string, id: string) {
        const bill = await this.prisma.bill.findFirst({
            where: { id, userId },
        });

        if (!bill) {
            throw new NotFoundException(`Bill with ID ${id} not found`);
        }

        return bill;
    }

    async update(userId: string, id: string, dto: UpdateBillDto) {
        await this.findOne(userId, id); // Check existence

        const updateData: Prisma.BillUpdateInput = {};
        if (dto.name) updateData.name = dto.name;
        if (dto.amount !== undefined) updateData.amount = dto.amount;
        if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
        if (dto.frequency) updateData.frequency = dto.frequency;
        if (dto.categoryId) updateData.categoryId = dto.categoryId;
        if (dto.categoryLabel) updateData.categoryLabel = dto.categoryLabel;
        if (dto.reminderDays !== undefined) updateData.reminderDays = dto.reminderDays;
        if (dto.notes !== undefined) updateData.notes = dto.notes;
        if (dto.isPaid !== undefined) updateData.isPaid = dto.isPaid;

        return this.prisma.bill.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(userId: string, id: string) {
        await this.findOne(userId, id); // Check existence

        return this.prisma.bill.delete({
            where: { id },
        });
    }

    async getUpcoming(userId: string, days: number = 7) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return this.prisma.bill.findMany({
            where: {
                userId,
                isPaid: false,
                dueDate: {
                    gte: now,
                    lte: futureDate,
                },
            },
            orderBy: { dueDate: 'asc' },
        });
    }

    async markAsPaid(userId: string, id: string) {
        await this.findOne(userId, id); // Check existence

        const bill = await this.prisma.bill.update({
            where: { id },
            data: {
                isPaid: true,
                paidAt: new Date(),
            },
        });

        // If recurring, create next bill
        if (bill.frequency !== 'once') {
            await this.createNextRecurringBill(bill);
        }

        return bill;
    }

    private async createNextRecurringBill(bill: Bill) {
        const nextDueDate = new Date(bill.dueDate);

        switch (bill.frequency) {
            case 'weekly':
                nextDueDate.setDate(nextDueDate.getDate() + 7);
                break;
            case 'monthly':
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                break;
            case 'yearly':
                nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                break;
        }

        return this.prisma.bill.create({
            data: {
                userId: bill.userId,
                name: bill.name,
                amount: bill.amount,
                currency: bill.currency,
                dueDate: nextDueDate,
                frequency: bill.frequency,
                categoryId: bill.categoryId,
                categoryLabel: bill.categoryLabel,
                reminderDays: bill.reminderDays,
                notes: bill.notes,
                isPaid: false,
            },
        });
    }

    async getStatistics(userId: string) {
        const [totalBills, unpaidBills, totalAmount, upcomingAmount] = await Promise.all([
            this.prisma.bill.count({ where: { userId } }),
            this.prisma.bill.count({ where: { userId, isPaid: false } }),
            this.prisma.bill.aggregate({
                where: { userId },
                _sum: { amount: true },
            }),
            this.prisma.bill.aggregate({
                where: {
                    userId,
                    isPaid: false,
                    dueDate: { gte: new Date() },
                },
                _sum: { amount: true },
            }),
        ]);

        return {
            totalBills,
            unpaidBills,
            totalAmount: totalAmount._sum.amount || 0,
            upcomingAmount: upcomingAmount._sum.amount || 0,
        };
    }
}
