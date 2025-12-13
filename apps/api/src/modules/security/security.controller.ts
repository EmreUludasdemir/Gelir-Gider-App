import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  Res,
} from "@nestjs/common";
import { Response, Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";
import { TwoFactorService } from "./two-factor.service";
import { OAuthService } from "./oauth.service";
import { AuditLogService } from "./audit-log.service";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma.service";

@Controller("security")
export class SecurityController {
  constructor(
    private twoFactorService: TwoFactorService,
    private oauthService: OAuthService,
    private auditLogService: AuditLogService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  // 2FA Endpoints
  @Post("2fa/setup")
  @UseGuards(JwtAuthGuard)
  async setup2FA(@User("id") userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (user?.twoFactorEnabled) {
      return { error: "2FA is already enabled" };
    }

    const secret = this.twoFactorService.generateSecret();
    const qrCodeUrl = this.twoFactorService.generateQRCodeUrl(
      user!.email,
      secret
    );

    // Save secret temporarily
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, qrCodeUrl };
  }

  @Post("2fa/enable")
  @UseGuards(JwtAuthGuard)
  async enable2FA(@User("id") userId: string, @Body("code") code: string) {
    const result = await this.twoFactorService.enable2FA(userId, code);
    if (result.success) {
      await this.auditLogService.log2FAEnabled(userId);
    }
    return result;
  }

  @Post("2fa/disable")
  @UseGuards(JwtAuthGuard)
  async disable2FA(@User("id") userId: string, @Body("code") code: string) {
    const success = await this.twoFactorService.disable2FA(userId, code);
    if (success) {
      await this.auditLogService.log2FADisabled(userId);
    }
    return { success };
  }

  @Post("2fa/verify")
  async verify2FA(@Body() body: { userId: string; code: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
      return { valid: false, error: "2FA not enabled" };
    }

    const valid = this.twoFactorService.verifyTOTP(
      user.twoFactorSecret,
      body.code
    );
    return { valid };
  }

  @Post("2fa/backup")
  async verifyBackupCode(@Body() body: { userId: string; code: string }) {
    const valid = await this.twoFactorService.verifyBackupCode(
      body.userId,
      body.code
    );
    return { valid };
  }

  // OAuth Endpoints
  @Get("oauth/google")
  async googleAuth(@Res() res: Response) {
    const url = this.oauthService.getGoogleAuthUrl();
    res.redirect(url);
  }

  @Get("oauth/google/callback")
  async googleCallback(
    @Query("code") code: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const profile = await this.oauthService.exchangeGoogleCode(code);

    if (!profile) {
      return res.redirect("/auth/login?error=oauth_failed");
    }

    const user = await this.oauthService.findOrCreateUser(profile);

    // Log the login
    await this.auditLogService.logLogin(
      user.id,
      req.ip,
      req.headers["user-agent"]
    );

    // Generate JWT
    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    // Redirect to frontend with token
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/auth/callback?token=${token}`
    );
  }

  @Get("oauth/github")
  async githubAuth(@Res() res: Response) {
    const url = this.oauthService.getGitHubAuthUrl();
    res.redirect(url);
  }

  @Get("oauth/github/callback")
  async githubCallback(
    @Query("code") code: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const profile = await this.oauthService.exchangeGitHubCode(code);

    if (!profile) {
      return res.redirect("/auth/login?error=oauth_failed");
    }

    const user = await this.oauthService.findOrCreateUser(profile);

    // Log the login
    await this.auditLogService.logLogin(
      user.id,
      req.ip,
      req.headers["user-agent"]
    );

    // Generate JWT
    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/auth/callback?token=${token}`
    );
  }

  // Audit Log Endpoints
  @Get("audit-logs")
  @UseGuards(JwtAuthGuard)
  async getAuditLogs(
    @User("id") userId: string,
    @Query("limit") limit?: string
  ) {
    return this.auditLogService.getRecentLogs(
      userId,
      limit ? parseInt(limit) : 50
    );
  }

  @Get("login-history")
  @UseGuards(JwtAuthGuard)
  async getLoginHistory(@User("id") userId: string) {
    return this.auditLogService.getLoginHistory(userId);
  }

  @Get("security-events")
  @UseGuards(JwtAuthGuard)
  async getSecurityEvents(@User("id") userId: string) {
    return this.auditLogService.getSecurityEvents(userId);
  }

  // Account status
  @Get("status")
  @UseGuards(JwtAuthGuard)
  async getSecurityStatus(@User("id") userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        googleId: true,
        githubId: true,
        createdAt: true,
      },
    });

    const recentFailedLogins =
      await this.auditLogService.getFailedLoginAttempts(
        userId,
        new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

    return {
      twoFactorEnabled: user?.twoFactorEnabled || false,
      googleConnected: !!user?.googleId,
      githubConnected: !!user?.githubId,
      accountAge: user?.createdAt,
      recentFailedLogins,
    };
  }
}
