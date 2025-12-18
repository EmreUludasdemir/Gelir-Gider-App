import { Module } from "@nestjs/common";
import { BankConnectionsController } from "./bank-connections.controller";
import { BankConnectionsService } from "./bank-connections.service";
import { PrismaModule } from "../../prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [BankConnectionsController],
  providers: [BankConnectionsService],
  exports: [BankConnectionsService],
})
export class BankConnectionsModule {}
