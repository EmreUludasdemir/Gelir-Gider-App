import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService, ConfirmPdfUploadDto } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { JwtPayload } from '../../shared/types';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('pdf')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@User() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadsService.processPdf(user.id, file);
  }

  @Post('pdf/preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async previewPdf(@User() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadsService.previewPdf(user.id, file);
  }

  @Post('pdf/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPdfUpload(@User() user: JwtPayload, @Body() body: ConfirmPdfUploadDto) {
    return this.uploadsService.confirmPdfUpload(user.id, body);
  }
}
