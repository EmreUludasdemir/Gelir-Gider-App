import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

interface ReportOptions {
    startDate: Date;
    endDate: Date;
    type?: 'summary' | 'detailed' | 'category';
    format?: 'pdf' | 'excel';
}

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(private prisma: PrismaService) { }

    async generateReport(userId: string, options: ReportOptions) {
        const { startDate, endDate, type = 'summary', format = 'pdf' } = options;

        // Fetch data
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: 'desc' },
        });

        const summary = this.calculateSummary(transactions);

        if (format === 'excel') {
            return this.generateExcel(transactions, summary, startDate, endDate);
        } else {
            return this.generatePDF(transactions, summary, startDate, endDate);
        }
    }

    private calculateSummary(transactions: any[]) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const categoryBreakdown = transactions.reduce((acc, t) => {
            if (!acc[t.categoryLabel]) {
                acc[t.categoryLabel] = { income: 0, expense: 0, count: 0 };
            }
            if (t.type === 'income') {
                acc[t.categoryLabel].income += t.amount;
            } else {
                acc[t.categoryLabel].expense += t.amount;
            }
            acc[t.categoryLabel].count++;
            return acc;
        }, {});

        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense,
            transactionCount: transactions.length,
            categoryBreakdown,
        };
    }

    private async generateExcel(transactions: any[], summary: any, startDate: Date, endDate: Date) {
        const workbook = new ExcelJS.Workbook();

        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Özet');
        summarySheet.columns = [
            { header: 'Metrik', key: 'metric', width: 30 },
            { header: 'Değer', key: 'value', width: 20 },
        ];

        summarySheet.addRows([
            { metric: 'Rapor Dönemi', value: `${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}` },
            { metric: 'Toplam Gelir', value: summary.totalIncome.toFixed(2) + ' TRY' },
            { metric: 'Toplam Gider', value: summary.totalExpense.toFixed(2) + ' TRY' },
            { metric: 'Net Bakiye', value: summary.balance.toFixed(2) + ' TRY' },
            { metric: 'İşlem Sayısı', value: summary.transactionCount },
        ]);

        // Transactions Sheet
        const transSheet = workbook.addWorksheet('İşlemler');
        transSheet.columns = [
            { header: 'Tarih', key: 'date', width: 12 },
            { header: 'Açıklama', key: 'description', width: 30 },
            { header: 'Kategori', key: 'category', width: 15 },
            { header: 'Tip', key: 'type', width: 10 },
            { header: 'Tutar', key: 'amount', width: 15 },
        ];

        transactions.forEach(t => {
            transSheet.addRow({
                date: new Date(t.date).toLocaleDateString('tr-TR'),
                description: t.description,
                category: t.categoryLabel,
                type: t.type === 'income' ? 'Gelir' : 'Gider',
                amount: t.amount.toFixed(2) + ' ' + t.currency,
            });
        });

        // Category Breakdown Sheet
        const catSheet = workbook.addWorksheet('Kategori Analizi');
        catSheet.columns = [
            { header: 'Kategori', key: 'category', width: 20 },
            { header: 'Gelir', key: 'income', width: 15 },
            { header: 'Gider', key: 'expense', width: 15 },
            { header: 'Net', key: 'net', width: 15 },
            { header: 'İşlem Sayısı', key: 'count', width: 15 },
        ];

        Object.entries(summary.categoryBreakdown).forEach(([category, data]: [string, any]) => {
            catSheet.addRow({
                category,
                income: data.income.toFixed(2),
                expense: data.expense.toFixed(2),
                net: (data.income - data.expense).toFixed(2),
                count: data.count,
            });
        });

        // Style headers
        [summarySheet, transSheet, catSheet].forEach(sheet => {
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            };
            sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        });

        return workbook.xlsx.writeBuffer();
    }

    private async generatePDF(transactions: any[], summary: any, startDate: Date, endDate: Date) {
        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('Gelir-Gider Raporu', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Dönem: ${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`, { align: 'center' });
            doc.moveDown(2);

            // Summary Box
            doc.fontSize(14).text('Özet', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11);
            doc.text(`Toplam Gelir: ${summary.totalIncome.toFixed(2)} TRY`);
            doc.text(`Toplam Gider: ${summary.totalExpense.toFixed(2)} TRY`);
            doc.text(`Net Bakiye: ${summary.balance.toFixed(2)} TRY`);
            doc.text(`İşlem Sayısı: ${summary.transactionCount}`);
            doc.moveDown(2);

            // Category Breakdown
            doc.fontSize(14).text('Kategori Analizi', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);

            Object.entries(summary.categoryBreakdown).forEach(([category, data]: [string, any]) => {
                doc.text(`${category}:`);
                doc.text(`  Gelir: ${data.income.toFixed(2)} TRY | Gider: ${data.expense.toFixed(2)} TRY | İşlem: ${data.count}`, {
                    indent: 20,
                });
                doc.moveDown(0.3);
            });

            doc.moveDown(2);

            // Transactions Table (first 50)
            doc.addPage();
            doc.fontSize(14).text('İşlemler (İlk 50)', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(9);

            transactions.slice(0, 50).forEach(t => {
                const dateStr = new Date(t.date).toLocaleDateString('tr-TR');
                const typeStr = t.type === 'income' ? 'GELİR' : 'GİDER';
                doc.text(`${dateStr} | ${t.description} | ${t.categoryLabel} | ${typeStr} | ${t.amount.toFixed(2)} ${t.currency}`);
                doc.moveDown(0.2);
            });

            // Footer
            doc.fontSize(8).text(
                `Rapor Oluşturma Tarihi: ${new Date().toLocaleString('tr-TR')}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();
        });
    }

    async scheduleMonthlyReport(userId: string, email: string) {
        // Implement email scheduling logic here
        this.logger.log(`Scheduled monthly report for user ${userId} to ${email}`);
        return { success: true, message: 'Aylık rapor planlandı' };
    }
}
