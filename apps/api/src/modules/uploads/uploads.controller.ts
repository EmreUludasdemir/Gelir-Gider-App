import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { JwtPayload } from '../../shared/types';
import { validateFile, DEFAULT_PDF_OPTIONS } from '../../shared/file-validation';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('pdf')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadPdf(@User() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    // Validate file type, size, and content
    validateFile(file, DEFAULT_PDF_OPTIONS);

    return this.uploadsService.processPdf(user.id, file);
  }
}
