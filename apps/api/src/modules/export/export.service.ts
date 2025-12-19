import { Injectable, StreamableFile } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import * as ExcelJS from "exceljs";
import * as PDFDocument from "pdfkit";
import { Response } from "express";
import { TransactionQuery } from "../../shared/types";

interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: "income" | "expense";
  categoryId?: string;
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  private async getTransactions(userId: string, filters: ExportFilters) {
    const where: any = { userId };

    if (filters.dateFrom) {
      where.date = { ...where.date, gte: new Date(filters.dateFrom) };
    }
    if (filters.dateTo) {
      where.date = { ...where.date, lte: new Date(filters.dateTo) };
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
    });
  }

  /**
   * Export transactions to CSV format
   */
  async exportToCSV(userId: string, filters: ExportFilters): Promise<string> {
    const transactions = await this.getTransactions(userId, filters);

    const headers = [
      "Tarih",
      "Açıklama",
      "Tutar",
      "Para Birimi",
      "Tür",
      "Kategori",
      "Kaynak",
    ];
    const rows = transactions.map((tx) => [
      tx.date.toISOString().split("T")[0],
      `"${tx.description.replace(/"/g, '""')}"`, // Escape quotes
      tx.amount.toFixed(2),
      tx.currency,
      tx.type === "income" ? "Gelir" : "Gider",
      tx.categoryLabel,
      tx.source === "manual" ? "Manuel" : "PDF",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    // Add BOM for Excel Turkish character support
    return "\uFEFF" + csv;
  }

  /**
   * Export transactions to Excel format
   */
  async exportToExcel(userId: string, filters: ExportFilters): Promise<Buffer> {
    const transactions = await this.getTransactions(userId, filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Gelir-Gider Uygulaması";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("İşlemler", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // Define columns
    sheet.columns = [
      { header: "Tarih", key: "date", width: 12 },
      { header: "Açıklama", key: "description", width: 40 },
      {
        header: "Tutar",
        key: "amount",
        width: 15,
        style: { numFmt: "#,##0.00 ₺" },
      },
      { header: "Para Birimi", key: "currency", width: 12 },
      { header: "Tür", key: "type", width: 10 },
      { header: "Kategori", key: "category", width: 20 },
      { header: "Kaynak", key: "source", width: 10 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" }, // Indigo
    };

    // Add data
    transactions.forEach((tx) => {
      const row = sheet.addRow({
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type === "income" ? "Gelir" : "Gider",
        category: tx.categoryLabel,
        source: tx.source === "manual" ? "Manuel" : "PDF",
      });

      // Color code income/expense
      if (tx.type === "income") {
        row.getCell("amount").font = { color: { argb: "FF16A34A" } }; // Green
      } else {
        row.getCell("amount").font = { color: { argb: "FFDC2626" } }; // Red
      }
    });

    // Add summary section
    sheet.addRow([]);
    const totalIncome = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalExpense = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    sheet.addRow(["", "Toplam Gelir:", totalIncome, "TRY"]);
    sheet.addRow(["", "Toplam Gider:", totalExpense, "TRY"]);
    sheet.addRow(["", "Net Bakiye:", totalIncome - totalExpense, "TRY"]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export transactions to PDF format
   */
  async exportToPDF(
    userId: string,
    filters: ExportFilters,
    res: Response
  ): Promise<void> {
    const transactions = await this.getTransactions(userId, filters);

    const doc = new PDFDocument({ margin: 50 });

    // Pipe to response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=islemler-${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Gelir-Gider Raporu", { align: "center" });
    doc.moveDown();

    // Date range
    const dateText =
      filters.dateFrom && filters.dateTo
        ? `${filters.dateFrom} - ${filters.dateTo}`
        : "Tüm Zamanlar";
    doc.fontSize(12).text(`Dönem: ${dateText}`, { align: "center" });
    doc.moveDown(2);

    // Summary
    const totalIncome = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalExpense = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    doc.fontSize(14).text("Özet", { underline: true });
    doc.fontSize(12);
    doc
      .fillColor("green")
      .text(`Toplam Gelir: ${totalIncome.toLocaleString("tr-TR")} TRY`);
    doc
      .fillColor("red")
      .text(`Toplam Gider: ${totalExpense.toLocaleString("tr-TR")} TRY`);
    doc
      .fillColor("black")
      .text(
        `Net Bakiye: ${(totalIncome - totalExpense).toLocaleString(
          "tr-TR"
        )} TRY`
      );
    doc.moveDown(2);

    // Transactions table
    doc.fontSize(14).text("İşlemler", { underline: true });
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    const col1 = 50,
      col2 = 120,
      col3 = 320,
      col4 = 420;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Tarih", col1, tableTop);
    doc.text("Açıklama", col2, tableTop);
    doc.text("Tutar", col3, tableTop);
    doc.text("Kategori", col4, tableTop);
    doc.moveDown();

    // Table rows
    doc.font("Helvetica").fontSize(9);
    let y = doc.y;

    transactions.slice(0, 50).forEach((tx) => {
      // Limit to 50 for PDF
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(tx.date.toISOString().split("T")[0], col1, y);
      doc.text(tx.description.substring(0, 30), col2, y);

      const amountColor = tx.type === "income" ? "green" : "red";
      doc
        .fillColor(amountColor)
        .text(`${tx.amount.toLocaleString("tr-TR")} TRY`, col3, y);
      doc.fillColor("black").text(tx.categoryLabel, col4, y);

      y += 15;
    });

    if (transactions.length > 50) {
      doc.moveDown();
      doc.text(`... ve ${transactions.length - 50} daha fazla işlem`, {
        align: "center",
      });
    }

    // Footer
    doc
      .fontSize(8)
      .text(
        `Oluşturulma Tarihi: ${new Date().toLocaleString("tr-TR")}`,
        50,
        doc.page.height - 50,
        { align: "center" }
      );

    doc.end();
  }
}
