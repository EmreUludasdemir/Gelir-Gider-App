import { Module } from "@nestjs/common";
import { GamificationService } from "./gamification.service";
import { GamificationController } from "./gamification.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
