import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateSavingsGoalDto, UpdateSavingsGoalDto } from './dto/savings-goal.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    return goal;
  }

  async create(userId: string, dto: CreateSavingsGoalDto) {
    return this.prisma.savingsGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount || 0,
        color: dto.color || '#8B5CF6',
        icon: dto.icon || '🎯',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateSavingsGoalDto) {
    await this.findOne(id, userId);

    const data: any = { ...dto };
    if (dto.deadline) {
      data.deadline = new Date(dto.deadline);
    }

    // Check if goal is completed
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (dto.currentAmount !== undefined && goal) {
      data.isCompleted = dto.currentAmount >= goal.targetAmount;
    }

    return this.prisma.savingsGoal.update({
      where: { id },
      data,
    });
  }

  async addAmount(id: string, userId: string, amount: number) {
    const goal = await this.findOne(id, userId);

    const newAmount = goal.currentAmount + amount;
    const isCompleted = newAmount >= goal.targetAmount;

    return this.prisma.savingsGoal.update({
      where: { id },
      data: {
        currentAmount: newAmount,
        isCompleted,
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.savingsGoal.delete({
      where: { id },
    });

    return { success: true };
  }

  async getSummary(userId: string) {
    const goals = await this.findAll(userId);

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const completedCount = goals.filter((g) => g.isCompleted).length;

    return {
      totalGoals: goals.length,
      completedGoals: completedCount,
      totalTarget,
      totalCurrent,
      overallProgress: totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0,
    };
  }
}
