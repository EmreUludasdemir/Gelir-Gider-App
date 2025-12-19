import { Module } from "@nestjs/common";
import { PushService } from "./push.service";
import { PushController } from "./push.controller";
import { PrismaModule } from "../../prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [PushService],
  controllers: [PushController],
  exports: [PushService],
})
export class PushModule {}
