import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { Response } from "express";
import { ApiQuery } from "@nestjs/swagger";
import { TransactionsService } from "./transactions.service";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQuery,
  JwtPayload,
} from "../../shared/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";

@UseGuards(JwtAuthGuard)
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@User() user: JwtPayload, @Query() query: TransactionQuery) {
    return this.transactionsService.findAll(user.id, query);
  }

  @Get("summary")
  getSummary(@User() user: JwtPayload, @Query() query: TransactionQuery) {
    return this.transactionsService.getSummary(user.id, query);
  }

  @Get("suggestions")
  getSuggestions(@User() user: JwtPayload) {
    return this.transactionsService.getSuggestions(user.id);
  }

  @Get("duplicates")
  getDuplicateGroups(
    @User() user: JwtPayload,
    @Query("days") days?: string,
    @Query("windowDays") windowDays?: string,
    @Query("amountTolerance") amountTolerance?: string
  ) {
    const parsedDays = days ? parseInt(days, 10) : undefined;
    const safeDays =
      parsedDays && Number.isFinite(parsedDays) && parsedDays > 0
        ? parsedDays
        : 90;
    const parsedWindow = windowDays ? parseInt(windowDays, 10) : undefined;
    const safeWindow =
      parsedWindow && Number.isFinite(parsedWindow) && parsedWindow > 0
        ? parsedWindow
        : 1;
    const parsedTolerance = amountTolerance
      ? parseFloat(amountTolerance)
      : undefined;
    const safeTolerance =
      parsedTolerance !== undefined && Number.isFinite(parsedTolerance) && parsedTolerance >= 0
        ? parsedTolerance
        : 0;

    return this.transactionsService.getDuplicateGroups(
      user.id,
      safeDays,
      safeWindow,
      safeTolerance
    );
  }

  @Post("duplicates/resolve")
  @HttpCode(HttpStatus.OK)
  resolveDuplicateGroup(
    @User() user: JwtPayload,
    @Body() body: { keepId: string; transactionIds: string[] }
  ) {
    return this.transactionsService.resolveDuplicateGroup(
      user.id,
      body.keepId,
      body.transactionIds
    );
  }

  @Get("recurring")
  getRecurringPayments(@User() user: JwtPayload) {
    return this.transactionsService.getRecurringPayments(user.id);
  }

  @Get("export")
  @ApiQuery({ name: "format", enum: ["csv", "excel"], required: true })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  async exportTransactions(
    @User() user: JwtPayload,
    @Query("format") format: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Res() res?: Response
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (format === "csv") {
      const csv = await this.transactionsService.exportToCSV(
        user.id,
        start,
        end
      );
      res!.setHeader("Content-Type", "text/csv; charset=utf-8");
      res!.setHeader(
        "Content-Disposition",
        'attachment; filename="islemler.csv"'
      );
      return res!.send(csv);
    } else if (format === "excel") {
      const buffer = await this.transactionsService.exportToExcel(
        user.id,
        start,
        end
      );
      res!.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res!.setHeader(
        "Content-Disposition",
        'attachment; filename="islemler.xlsx"'
      );
      return res!.send(buffer);
    } else {
      throw new BadRequestException(
        "Geçersiz format. csv veya excel kullanın."
      );
    }
  }

  @Get(":id")
  findOne(@User() user: JwtPayload, @Param("id") id: string) {
    return this.transactionsService.findOne(user.id, id);
  }

  @Post("manual")
  @HttpCode(HttpStatus.CREATED)
  create(@User() user: JwtPayload, @Body() createDto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, createDto);
  }

  @Patch(":id")
  update(
    @User() user: JwtPayload,
    @Param("id") id: string,
    @Body() updateDto: UpdateTransactionDto
  ) {
    return this.transactionsService.update(user.id, id, updateDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  delete(@User() user: JwtPayload, @Param("id") id: string) {
    return this.transactionsService.delete(user.id, id);
  }
}
