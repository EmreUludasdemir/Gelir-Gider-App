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
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { CreateBillDto, UpdateBillDto } from './dto/bill.dto';

@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
    constructor(private readonly billsService: BillsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@User('id') userId: string, @Body() createBillDto: CreateBillDto) {
        return this.billsService.create(userId, createBillDto);
    }

    @Get()
    findAll(
        @User('id') userId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('isPaid') isPaid?: string,
    ) {
        const isPaidBoolean = isPaid === 'true' ? true : isPaid === 'false' ? false : undefined;
        return this.billsService.findAll(userId, { page, limit, isPaid: isPaidBoolean });
    }

    @Get('statistics')
    getStatistics(@User('id') userId: string) {
        return this.billsService.getStatistics(userId);
    }

    @Get('upcoming')
    getUpcoming(
        @User('id') userId: string,
        @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
    ) {
        return this.billsService.getUpcoming(userId, days);
    }

    @Get(':id')
    findOne(@User('id') userId: string, @Param('id') id: string) {
        return this.billsService.findOne(userId, id);
    }

    @Patch(':id')
    update(
        @User('id') userId: string,
        @Param('id') id: string,
        @Body() updateBillDto: UpdateBillDto,
    ) {
        return this.billsService.update(userId, id, updateBillDto);
    }

    @Patch(':id/mark-paid')
    @HttpCode(HttpStatus.OK)
    markAsPaid(@User('id') userId: string, @Param('id') id: string) {
        return this.billsService.markAsPaid(userId, id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@User('id') userId: string, @Param('id') id: string) {
        return this.billsService.remove(userId, id);
    }
}
