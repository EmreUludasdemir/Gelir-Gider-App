import { Controller, Get, Query, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('generate')
    async generateReport(
        @User('id') userId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('format') format: 'pdf' | 'excel' = 'pdf',
        @Res() res: Response,
    ) {
        const buffer = await this.reportsService.generateReport(userId, {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            format,
        });

        const filename = `rapor_${startDate}_${endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        const mimeType = format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(HttpStatus.OK).send(buffer);
    }
}
