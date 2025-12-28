import { Module } from "@nestjs/common";
import { BankConnectionsController } from "./bank-connections.controller";
import { BankConnectionsService } from "./bank-connections.service";
import { BankSyncService } from "./bank-sync.service";
import { PrismaModule } from "../../prisma.module";
import { EncryptionService } from "../../shared/encryption";

@Module({
  imports: [PrismaModule],
  controllers: [BankConnectionsController],
  providers: [BankConnectionsService, BankSyncService, EncryptionService],
  exports: [BankConnectionsService, BankSyncService],
})
export class BankConnectionsModule {}
