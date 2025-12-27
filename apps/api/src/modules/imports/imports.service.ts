import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateTransactionDto } from '../../shared/types';
import * as ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';

interface ImportResult {
    success: boolean;
    filename: string;
    totalRows: number;
    importedCount: number;
    skippedCount: number;
    errors: Array<{ row: number; message: string }>;
}

interface ParsedRow {
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
    notes?: string;
}

interface RawRecord {
    date?: string | Date;
    tarih?: string | Date;
    Date?: string | Date;
    Tarih?: string | Date;
    işlem_tarihi?: string | Date;
    description?: string;
    açıklama?: string;
    Description?: string;
    Açıklama?: string;
    aciklama?: string;
    amount?: string | number;
    tutar?: string | number;
    Amount?: string | number;
    Tutar?: string | number;
    miktar?: string | number;
    type?: string;
    tip?: string;
    Type?: string;
    Tip?: string;
    işlem_tipi?: string;
    category?: string;
    kategori?: string;
    Category?: string;
    Kategori?: string;
    notes?: string;
    notlar?: string;
    Notes?: string;
    Notlar?: string;
    [key: string]: unknown;
}

type DateValue = string | Date | number | null | undefined;
type AmountValue = string | number | null | undefined;

@Injectable()
export class ImportsService {
    private readonly logger = new Logger(ImportsService.name);

    constructor(private readonly transactionsService: TransactionsService) { }

    async importFile(userId: string, file: Express.Multer.File): Promise<ImportResult> {
        this.logger.log(`Importing file for user ${userId}: ${file.originalname}`);

        const extension = file.originalname.split('.').pop()?.toLowerCase();
        let rows: ParsedRow[] = [];

        try {
            if (extension === 'csv') {
                rows = await this.parseCSV(file.buffer);
            } else if (extension === 'xlsx' || extension === 'xls') {
                rows = await this.parseExcel(file.buffer);
            } else {
                throw new BadRequestException('Unsupported file format. Please use CSV or Excel files.');
            }
        } catch (error) {
            throw new BadRequestException(`Failed to parse file: ${error.message}`);
        }

        return this.importRows(userId, rows, file.originalname);
    }

    private async parseCSV(buffer: Buffer): Promise<ParsedRow[]> {
        const content = buffer.toString('utf-8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        return records.map((record: RawRecord) => this.normalizeRow(record));
    }

    private async parseExcel(buffer: Buffer): Promise<ParsedRow[]> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error('No worksheet found in Excel file');
        }

        const rows: ParsedRow[] = [];
        const headers: string[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                // First row is headers
                row.eachCell((cell) => {
                    headers.push(String(cell.value).toLowerCase());
                });
            } else {
                const rowData: RawRecord = {};
                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber - 1];
                    rowData[header] = cell.value as string | number | Date;
                });

                if (Object.keys(rowData).length > 0) {
                    rows.push(this.normalizeRow(rowData));
                }
            }
        });

        return rows;
    }

    private normalizeRow(record: RawRecord): ParsedRow {
        // Support multiple column name variations
        const date =
            record.date || record.tarih || record.Date || record.Tarih || record.işlem_tarihi;
        const description =
            record.description ||
            record.açıklama ||
            record.Description ||
            record.Açıklama ||
            record.aciklama;
        const amount =
            record.amount || record.tutar || record.Amount || record.Tutar || record.miktar;
        const type =
            record.type || record.tip || record.Type || record.Tip || record.işlem_tipi;
        const category =
            record.category || record.kategori || record.Category || record.Kategori;
        const notes = record.notes || record.notlar || record.Notes || record.Notlar;

        return {
            date: this.parseDate(date),
            description: String(description || 'İşlem'),
            amount: this.parseAmount(amount),
            type: this.parseType(type, amount),
            category,
            notes,
        };
    }

    private parseDate(value: DateValue): string {
        if (!value) {
            return new Date().toISOString().split('T')[0];
        }

        // If already a date object
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }

        // If string in various formats
        const str = String(value);

        // Try ISO format
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            return str.split('T')[0];
        }

        // Try DD/MM/YYYY or DD.MM.YYYY
        const dmyMatch = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
        if (dmyMatch) {
            const [, day, month, year] = dmyMatch;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // Default to today
        return new Date().toISOString().split('T')[0];
    }

    private parseAmount(value: AmountValue): number {
        if (typeof value === 'number') {
            return Math.abs(value);
        }

        // Remove currency symbols and convert
        const str = String(value).replace(/[^\d.,-]/g, '');
        const num = parseFloat(str.replace(',', '.'));

        return isNaN(num) ? 0 : Math.abs(num);
    }

    private parseType(typeValue: string | undefined, amountValue: AmountValue): 'income' | 'expense' {
        if (typeValue) {
            const str = String(typeValue).toLowerCase();
            if (str.includes('gelir') || str.includes('income') || str.includes('giriş')) {
                return 'income';
            }
            if (str.includes('gider') || str.includes('expense') || str.includes('çıkış')) {
                return 'expense';
            }
        }

        // If no type specified, check amount sign
        const amount = typeof amountValue === 'number' ? amountValue : parseFloat(String(amountValue));
        return amount < 0 ? 'expense' : 'income';
    }

    private async importRows(
        userId: string,
        rows: ParsedRow[],
        filename: string,
    ): Promise<ImportResult> {
        const result: ImportResult = {
            success: true,
            filename,
            totalRows: rows.length,
            importedCount: 0,
            skippedCount: 0,
            errors: [],
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // +1 for 0-index, +1 for header row

            try {
                // Validate row
                if (!row.description || row.amount === 0) {
                    result.skippedCount++;
                    result.errors.push({
                        row: rowNumber,
                        message: 'Missing required fields (description or amount)',
                    });
                    continue;
                }

                // Create transaction
                const transactionDto: CreateTransactionDto = {
                    date: row.date,
                    description: row.description,
                    amount: row.amount,
                    type: row.type,
                    categoryId: '', // Will be auto-categorized
                    categoryLabel: row.category || '',
                    notes: row.notes,
                };

                await this.transactionsService.create(userId, transactionDto);
                result.importedCount++;
            } catch (error) {
                result.skippedCount++;
                result.errors.push({
                    row: rowNumber,
                    message: error.message || 'Unknown error',
                });
            }
        }

        if (result.importedCount === 0) {
            result.success = false;
        }

        this.logger.log(
            `Import completed: ${result.importedCount}/${result.totalRows} rows imported`,
        );

        return result;
    }

    generateTemplate(format: 'csv' | 'xlsx'): Buffer {
        const headers = ['date', 'description', 'amount', 'type', 'category', 'notes'];
        const sampleData = [
            ['2024-01-01', 'Maaş', '15000', 'income', 'Gelir', 'Aylık maaş'],
            ['2024-01-02', 'Market alışverişi', '500', 'expense', 'Market', 'Migros'],
            ['2024-01-03', 'Elektrik faturası', '350', 'expense', 'Fatura', 'TEDAŞ'],
        ];

        if (format === 'csv') {
            const lines = [headers.join(',')];
            sampleData.forEach((row) => {
                lines.push(row.join(','));
            });
            return Buffer.from(lines.join('\n'), 'utf-8');
        } else {
            // Excel format
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Transactions');

            // Add headers
            worksheet.addRow(headers);

            // Style headers
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' },
            };

            // Add sample data
            sampleData.forEach((row) => {
                worksheet.addRow(row);
            });

            // Auto-fit columns
            worksheet.columns.forEach((column) => {
                column.width = 20;
            });

            // Note: writeBuffer() returns Promise<ExcelJS.Buffer>
            // Using type assertion for synchronous return signature
            return workbook.xlsx.writeBuffer() as unknown as Buffer;
        }
    }
}
