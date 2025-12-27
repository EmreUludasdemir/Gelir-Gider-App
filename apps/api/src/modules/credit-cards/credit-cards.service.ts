import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreateCreditCardDto, UpdateCreditCardDto } from "./dto/credit-card.dto";

@Injectable()
export class CreditCardService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.creditCard.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, userId: string) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id, userId },
    });

    if (!card) throw new NotFoundException("Credit card not found");
    return card;
  }

  async create(userId: string, dto: CreateCreditCardDto) {
    return this.prisma.creditCard.create({
      data: {
        userId,
        name: dto.name,
        lastFourDigits: dto.lastFourDigits,
        cardType: dto.cardType || "visa",
        creditLimit: dto.creditLimit,
        currentBalance: dto.currentBalance || 0,
        billingDay: dto.billingDay || 1,
        dueDay: dto.dueDay || 15,
        interestRate: dto.interestRate || 0,
        color: dto.color || "#1F2937",
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateCreditCardDto) {
    await this.findOne(id, userId);

    return this.prisma.creditCard.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.creditCard.delete({
      where: { id },
    });
  }

  // Add expense to card balance
  async addExpense(id: string, userId: string, amount: number) {
    const card = await this.findOne(id, userId);

    const newBalance = card.currentBalance + amount;
    if (newBalance > card.creditLimit) {
      throw new BadRequestException("This would exceed credit limit");
    }

    return this.prisma.creditCard.update({
      where: { id },
      data: { currentBalance: newBalance },
    });
  }

  // Make payment
  async makePayment(id: string, userId: string, amount: number) {
    const card = await this.findOne(id, userId);

    const newBalance = Math.max(0, card.currentBalance - amount);

    return this.prisma.creditCard.update({
      where: { id },
      data: { currentBalance: newBalance },
    });
  }

  // Get summary for all cards
  async getSummary(userId: string) {
    const cards = await this.prisma.creditCard.findMany({
      where: { userId, isActive: true },
    });

    const totalLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalBalance = cards.reduce((sum, c) => sum + c.currentBalance, 0);
    const availableCredit = totalLimit - totalBalance;
    const utilizationRate =
      totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

    // Find cards with upcoming due dates
    const today = new Date().getDate();
    const cardsWithUpcomingDue = cards.filter((c) => {
      const daysUntilDue =
        c.dueDay >= today ? c.dueDay - today : 30 - today + c.dueDay;
      return daysUntilDue <= 7 && c.currentBalance > 0;
    });

    return {
      totalCards: cards.length,
      totalLimit,
      totalBalance,
      availableCredit,
      utilizationRate,
      upcomingPayments: cardsWithUpcomingDue.map((c) => ({
        cardName: c.name,
        dueDay: c.dueDay,
        balance: c.currentBalance,
        minPayment: c.minPayment,
      })),
    };
  }

  // Calculate installment
  calculateInstallment(
    totalAmount: number,
    months: number,
    interestRate: number
  ) {
    if (interestRate === 0) {
      return {
        monthlyPayment: totalAmount / months,
        totalPayment: totalAmount,
        totalInterest: 0,
      };
    }

    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment =
      (totalAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - totalAmount;

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    };
  }
}
