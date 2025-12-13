import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TwoFactorService } from "./two-factor.service";
import { OAuthService } from "./oauth.service";
import { AuditLogService } from "./audit-log.service";
import { SecurityController } from "./security.controller";
import { PrismaModule } from "../../prisma.module";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [SecurityController],
  providers: [TwoFactorService, OAuthService, AuditLogService],
  exports: [TwoFactorService, OAuthService, AuditLogService],
})
export class SecurityModule {}
