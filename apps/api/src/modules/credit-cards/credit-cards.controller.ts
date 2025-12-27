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
import { CreditCardService } from "./credit-cards.service";
import {
  CreateCreditCardDto,
  UpdateCreditCardDto,
  CreditCardAmountDto,
  InstallmentCalculationDto,
} from "./dto/credit-card.dto";

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
    @Body() dto: CreditCardAmountDto
  ) {
    return this.creditCardService.addExpense(id, userId, dto.amount);
  }

  @Post(":id/payment")
  async makePayment(
    @Param("id") id: string,
    @User("id") userId: string,
    @Body() dto: CreditCardAmountDto
  ) {
    return this.creditCardService.makePayment(id, userId, dto.amount);
  }

  @Post("calculate-installment")
  async calculateInstallment(@Body() dto: InstallmentCalculationDto) {
    return this.creditCardService.calculateInstallment(
      dto.totalAmount,
      dto.months,
      dto.interestRate
    );
  }
}
