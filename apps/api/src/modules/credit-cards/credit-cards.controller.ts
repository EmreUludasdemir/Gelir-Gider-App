import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";
import {
  CreditCardService,
  CreateCreditCardDto,
  UpdateCreditCardDto,
} from "./credit-cards.service";

@Controller("credit-cards")
@UseGuards(JwtAuthGuard)
export class CreditCardsController {
  constructor(private creditCardService: CreditCardService) {}

  @Get()
  async findAll(@User("id") userId: string) {
    return this.creditCardService.findAll(userId);
  }

  @Get("summary")
  async getSummary(@User("id") userId: string) {
    return this.creditCardService.getSummary(userId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @User("id") userId: string) {
    return this.creditCardService.findOne(id, userId);
  }

  @Post()
  async create(@User("id") userId: string, @Body() dto: CreateCreditCardDto) {
    return this.creditCardService.create(userId, dto);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @User("id") userId: string,
    @Body() dto: UpdateCreditCardDto
  ) {
    return this.creditCardService.update(id, userId, dto);
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @User("id") userId: string) {
    return this.creditCardService.delete(id, userId);
  }

  @Post(":id/expense")
  async addExpense(
    @Param("id") id: string,
    @User("id") userId: string,
    @Body("amount") amount: number
  ) {
    return this.creditCardService.addExpense(id, userId, amount);
  }

  @Post(":id/payment")
  async makePayment(
    @Param("id") id: string,
    @User("id") userId: string,
    @Body("amount") amount: number
  ) {
    return this.creditCardService.makePayment(id, userId, amount);
  }

  @Post("calculate-installment")
  async calculateInstallment(
    @Body() body: { totalAmount: number; months: number; interestRate: number }
  ) {
    return this.creditCardService.calculateInstallment(
      body.totalAmount,
      body.months,
      body.interestRate
    );
  }
}
