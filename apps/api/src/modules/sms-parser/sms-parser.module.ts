import { Module } from '@nestjs/common';
import { SmsParserController } from './sms-parser.controller';
import { SmsParserService } from './sms-parser.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SmsParserController],
  providers: [SmsParserService],
  exports: [SmsParserService],
})
export class SmsParserModule {}
