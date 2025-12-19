import { Controller, Get, Query, Res, UseGuards, Header } from "@nestjs/common";
import { Response } from "express";
import { ExportService } from "./export.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";
import { SkipThrottle } from "@nestjs/throttler";

interface ExportQueryDto {
  dateFrom?: string;
  dateTo?: string;
  type?: "income" | "expense";
  categoryId?: string;
}

@UseGuards(JwtAuthGuard)
@Controller("export")
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * Export transactions to CSV file
   * GET /export/csv
   */
  @Get("csv")
  @SkipThrottle()
  @Header("Content-Type", "text/csv; charset=utf-8")
  async exportCSV(
    @User() user: any,
    @Query() query: ExportQueryDto,
    @Res() res: Response
  ) {
    const csv = await this.exportService.exportToCSV(user.id, query);

    const filename = `islemler-${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export transactions to Excel file
   * GET /export/excel
   */
  @Get("excel")
  @SkipThrottle()
  @Header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  async exportExcel(
    @User() user: any,
    @Query() query: ExportQueryDto,
    @Res() res: Response
  ) {
    const buffer = await this.exportService.exportToExcel(user.id, query);

    const filename = `islemler-${new Date().toISOString().split("T")[0]}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * Export transactions to PDF report
   * GET /export/pdf
   */
  @Get("pdf")
  @SkipThrottle()
  async exportPDF(
    @User() user: any,
    @Query() query: ExportQueryDto,
    @Res() res: Response
  ) {
    await this.exportService.exportToPDF(user.id, query, res);
  }
}
