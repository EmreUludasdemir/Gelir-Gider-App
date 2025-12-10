import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }

  @Post('pdf')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@User() user: any, @UploadedFile() file: Express.Multer.File) {
    console.log('📤 PDF Upload Request:', {
      user: user?.id || 'no user',
      file: file ? `${file.originalname} (${file.size} bytes)` : 'no file',
    });
    
    if (!file) {
      console.error('❌ No file received in upload request');
      throw new BadRequestException('No file provided');
    }
    
    return this.uploadsService.processPdf(user.id, file);
  }
}
