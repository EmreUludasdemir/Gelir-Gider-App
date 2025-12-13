import { Module } from "@nestjs/common";
import { CreditCardService } from "./credit-cards.service";
import { CreditCardsController } from "./credit-cards.controller";
import { PrismaModule } from "../../prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CreditCardsController],
  providers: [CreditCardService],
  exports: [CreditCardService],
})
export class CreditCardsModule {}
