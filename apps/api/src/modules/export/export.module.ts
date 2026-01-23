import { Module } from "@nestjs/common";
import { ExportService } from "./export.service";
import { ExportController } from "./export.controller";
import { PrismaModule } from "../../prisma.module";
import { PlanFeatureGuard } from "../billing/plan.guard";

@Module({
  imports: [PrismaModule],
  providers: [ExportService, PlanFeatureGuard],
  controllers: [ExportController],
  exports: [ExportService],
})
export class ExportModule {}
