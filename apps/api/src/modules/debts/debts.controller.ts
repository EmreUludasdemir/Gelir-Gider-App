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
import { DebtsService } from './debts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { CreateDebtDto, UpdateDebtDto } from './dto/debt.dto';

@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtsController {
    constructor(private readonly debtsService: DebtsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@User('id') userId: string, @Body() createDebtDto: CreateDebtDto) {
        return this.debtsService.create(userId, createDebtDto);
    }

    @Get()
    findAll(
        @User('id') userId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('type') type?: 'owed_to_me' | 'i_owe',
        @Query('isPaid') isPaid?: string,
    ) {
        const isPaidBoolean = isPaid === 'true' ? true : isPaid === 'false' ? false : undefined;
        return this.debtsService.findAll(userId, { page, limit, type, isPaid: isPaidBoolean });
    }

    @Get('summary')
    getSummary(@User('id') userId: string) {
        return this.debtsService.getSummary(userId);
    }

    @Get(':id')
    findOne(@User('id') userId: string, @Param('id') id: string) {
        return this.debtsService.findOne(userId, id);
    }

    @Patch(':id')
    update(
        @User('id') userId: string,
        @Param('id') id: string,
        @Body() updateDebtDto: UpdateDebtDto,
    ) {
        return this.debtsService.update(userId, id, updateDebtDto);
    }

    @Patch(':id/mark-paid')
    @HttpCode(HttpStatus.OK)
    markAsPaid(@User('id') userId: string, @Param('id') id: string) {
        return this.debtsService.markAsPaid(userId, id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@User('id') userId: string, @Param('id') id: string) {
        return this.debtsService.remove(userId, id);
    }
}
