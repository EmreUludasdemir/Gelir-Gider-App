import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";
import { BankConnectionsService } from "./bank-connections.service";
import {
  CreateBankConnectionDto,
  UpdateBankConnectionDto,
} from "./dto/bank-connection.dto";

@Controller("bank-connections")
@UseGuards(JwtAuthGuard)
export class BankConnectionsController {
  constructor(
    private readonly bankConnectionsService: BankConnectionsService
  ) {}

  // Get available banks
  @Get("banks")
  async getAvailableBanks() {
    return this.bankConnectionsService.getAvailableBanks();
  }

  // Create new bank connection
  @Post()
  async create(
    @User("id") userId: string,
    @Body() dto: CreateBankConnectionDto
  ) {
    return this.bankConnectionsService.create(userId, dto);
  }

  // Get all connections
  @Get()
  async findAll(@User("id") userId: string) {
    return this.bankConnectionsService.findAll(userId);
  }

  // Get single connection
  @Get(":id")
  async findOne(@User("id") userId: string, @Param("id") id: string) {
    return this.bankConnectionsService.findOne(userId, id);
  }

  // Update connection
  @Patch(":id")
  async update(
    @User("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateBankConnectionDto
  ) {
    return this.bankConnectionsService.update(userId, id, dto);
  }

  // Delete connection
  @Delete(":id")
  async remove(@User("id") userId: string, @Param("id") id: string) {
    return this.bankConnectionsService.remove(userId, id);
  }

  // Sync transactions from bank
  @Post(":id/sync")
  async syncTransactions(@User("id") userId: string, @Param("id") id: string) {
    return this.bankConnectionsService.syncTransactions(userId, id);
  }
}
