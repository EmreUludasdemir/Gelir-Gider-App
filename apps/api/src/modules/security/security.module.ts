import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TwoFactorService } from "./two-factor.service";
import { OAuthService } from "./oauth.service";
import { AuditLogService } from "./audit-log.service";
import { SecurityController } from "./security.controller";
import { PrismaModule } from "../../prisma.module";
import { SecurityConfig } from "../../shared";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: SecurityConfig.jwt.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [SecurityController],
  providers: [TwoFactorService, OAuthService, AuditLogService],
  exports: [TwoFactorService, OAuthService, AuditLogService],
})
export class SecurityModule {}
