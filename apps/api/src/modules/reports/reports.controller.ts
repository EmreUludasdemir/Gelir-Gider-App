import { Controller, Get, Post, Delete, Query, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { AdvancedReportsService, ScheduledReportConfig } from './advanced-reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
        private readonly advancedReportsService: AdvancedReportsService,
    ) {}

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

    /**
     * Get yearly comparison report (this year vs last year)
     */
    @Get('yearly-comparison')
    async getYearlyComparison(
        @User('id') userId: string,
        @Query('year') year?: string,
    ) {
        const yearNum = year ? parseInt(year, 10) : undefined;
        return this.advancedReportsService.getYearlyComparison(userId, yearNum);
    }

    /**
     * Get category trend analysis
     */
    @Get('category-trends')
    async getCategoryTrends(
        @User('id') userId: string,
        @Query('months') months: string = '6',
        @Query('type') type: 'expense' | 'income' | 'all' = 'expense',
    ) {
        return this.advancedReportsService.getCategoryTrends(
            userId,
            parseInt(months, 10),
            type,
        );
    }

    /**
     * Schedule email reports
     */
    @Post('schedule')
    async scheduleEmailReport(
        @User('id') userId: string,
        @User('email') userEmail: string,
        @Body() body: { frequency: 'weekly' | 'monthly'; email?: string },
    ) {
        const config: ScheduledReportConfig = {
            userId,
            email: body.email || userEmail,
            frequency: body.frequency,
            enabled: true,
        };
        return this.advancedReportsService.scheduleEmailReport(config);
    }

    /**
     * Cancel scheduled email report
     */
    @Delete('schedule')
    async cancelScheduledReport(@User('id') userId: string) {
        return this.advancedReportsService.cancelScheduledReport(userId);
    }

    /**
     * Get scheduled report config
     */
    @Get('schedule')
    async getScheduledReportConfig(@User('id') userId: string) {
        const config = await this.advancedReportsService.getScheduledReportConfig(userId);
        return { scheduled: !!config, config };
    }

    /**
     * Get digest preview
     */
    @Get('digest-preview')
    async getDigestPreview(
        @User('id') userId: string,
        @Query('type') type: 'weekly' | 'monthly' = 'weekly',
    ) {
        return this.advancedReportsService.getDigestPreview(userId, type);
    }
}
