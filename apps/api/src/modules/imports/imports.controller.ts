import {
    Controller,
    Post,
    Get,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Res,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('imports')
export class ImportsController {
    constructor(private readonly importsService: ImportsService) { }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
            fileFilter: (req, file, cb) => {
                if (!file.originalname.match(/\.(csv|xlsx|xls)$/)) {
                    return cb(new BadRequestException('Only CSV and Excel files are allowed'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadFile(@User('id') userId: string, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        return this.importsService.importFile(userId, file);
    }

    @Get('template')
    async downloadTemplate(
        @Query('format') format: string = 'csv',
        @Res() res: Response,
    ) {
        if (format !== 'csv' && format !== 'xlsx') {
            throw new BadRequestException('Format must be csv or xlsx');
        }

        const buffer = this.importsService.generateTemplate(format as 'csv' | 'xlsx');

        const filename = `transaction_template.${format}`;
        const mimeType =
            format === 'csv'
                ? 'text/csv'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
}
