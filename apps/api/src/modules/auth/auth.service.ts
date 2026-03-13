import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma.service'
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  RefreshTokenDto,
  RequestPasswordResetDto,
  ConfirmPasswordResetDto,
  RequestEmailVerificationDto,
  ConfirmEmailVerificationDto,
} from './dto/auth.dto'
import { EmailService } from '../notifications/email.service'
import { CacheService } from '../../shared/cache'
import * as bcrypt from 'bcrypt'
import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'
import * as crypto from 'crypto'

type TokenType = 'access' | 'refresh' | 'email_verification' | 'password_reset'

interface TokenPayload {
  sub: string
  email: string
  type: TokenType
  jti?: string
}

interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    name?: string
    twoFactorEnabled: boolean
    emailVerified: boolean
  }
}

interface UserForToken {
  id: string
  email: string
  name: string | null
  twoFactorEnabled: boolean
}

export interface AuthenticatedUserProfile {
  id: string
  email: string
  name?: string
  twoFactorEnabled: boolean
  emailVerified: boolean
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly JWT_ACCESS_EXPIRES_IN = '15m'
  private readonly JWT_REFRESH_EXPIRES_IN = '7d'
  private readonly EMAIL_VERIFICATION_EXPIRES_IN = '24h'
  private readonly PASSWORD_RESET_EXPIRES_IN = '30m'
  private readonly REFRESH_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private cache: CacheService,
  ) {}

  async register(dto: RegisterDto) {
    this.logger.log(`Attempting to register user: ${dto.email}`)

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (existing) {
      throw new ConflictException('User already exists')
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(dto.password, salt)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    })

    await this.sendVerificationEmailSafe(user.id, user.email, user.name)

    this.logger.log(`User registered successfully: ${user.email}`)

    const result = { ...user } as Omit<typeof user, 'password'> & { password?: string }
    delete result.password
    return result
  }

  async login(dto: LoginDto): Promise<TokenResponse> {
    this.logger.log(`Login attempt for: ${dto.email}`)

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isMatch = await bcrypt.compare(dto.password, user.password)
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!dto.twoFactorCode) {
        throw new UnauthorizedException('2FA code required')
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: dto.twoFactorCode,
        window: 2,
      })

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code')
      }
    }

    return this.generateTokens(user)
  }

  async refreshToken(dto: RefreshTokenDto = {}, cookieRefreshToken?: string): Promise<TokenResponse> {
    const refreshToken = dto.refreshToken?.trim() || cookieRefreshToken?.trim()
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required')
    }

    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      })

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type')
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      })

      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      await this.assertActiveRefreshSession(payload.sub, refreshToken)

      return this.generateTokens(user)
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(refreshToken?: string): Promise<{ message: string }> {
    await this.revokeRefreshSessionFromToken(refreshToken)
    return { message: 'Logout successful' }
  }

  async getProfile(userId: string): Promise<AuthenticatedUserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      twoFactorEnabled: user.twoFactorEnabled || false,
      emailVerified: await this.isEmailVerified(user.id),
    }
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (user) {
      const token = this.createPasswordResetToken(user.id, user.email, user.password)
      const resetUrl = `${this.getFrontendBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`

      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Gelir-Gider Sifre Sifirlama',
        html: `
          <p>Merhaba${user.name ? ` ${user.name}` : ''},</p>
          <p>Sifre sifirlama talebi aldik.</p>
          <p><a href="${resetUrl}">Sifreni sifirla</a></p>
          <p>Bu baglanti 30 dakika gecerlidir.</p>
        `,
      })

      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'password_reset_requested',
          success: true,
          details: JSON.stringify({ email: user.email }),
        },
      })
    }

    return {
      message: 'Eger hesap varsa sifre sifirlama adimlari e-posta adresine gonderildi.',
    }
  }

  async confirmPasswordReset(dto: ConfirmPasswordResetDto) {
    const decoded = this.jwtService.decode(dto.token) as Partial<TokenPayload> | null

    if (!decoded?.sub || !decoded?.email || decoded.type !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    })

    if (!user || user.email !== decoded.email) {
      throw new UnauthorizedException('Invalid reset token')
    }

    try {
      const secret = this.getPasswordResetSecret(user.password)
      const verified = this.jwtService.verify<TokenPayload>(dto.token, { secret })

      if (verified.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token type')
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token')
    }

    const sameAsCurrent = await bcrypt.compare(dto.newPassword, user.password)
    if (sameAsCurrent) {
      throw new BadRequestException('New password must differ from current password')
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt)

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    await this.revokeRefreshSession(user.id)

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'password_reset_completed',
        success: true,
      },
    })

    return { message: 'Password reset successful' }
  }

  async requestEmailVerification(dto: RequestEmailVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (user) {
      await this.sendVerificationEmailSafe(user.id, user.email, user.name)

      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'email_verification_requested',
          success: true,
          details: JSON.stringify({ email: user.email }),
        },
      })
    }

    return {
      message: 'Eger hesap varsa dogrulama adimlari e-posta adresine gonderildi.',
    }
  }

  async confirmEmailVerification(dto: ConfirmEmailVerificationDto) {
    let payload: TokenPayload

    try {
      payload = this.jwtService.verify<TokenPayload>(dto.token, {
        secret: this.getEmailVerificationSecret(),
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token')
    }

    if (payload.type !== 'email_verification') {
      throw new UnauthorizedException('Invalid token type')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException('Invalid verification token')
    }

    const alreadyVerified = await this.isEmailVerified(user.id)

    if (!alreadyVerified) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'email_verified',
          success: true,
          details: JSON.stringify({ verifiedAt: new Date().toISOString() }),
        },
      })
    }

    return {
      message: alreadyVerified ? 'Email already verified' : 'Email verification successful',
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password)
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect')
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt)

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    await this.revokeRefreshSession(userId)

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'password_change',
        success: true,
      },
    })

    this.logger.log(`Password changed for user: ${user.email}`)

    return { message: 'Password changed successfully' }
  }

  async generate2FASecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const secret = speakeasy.generateSecret({
      name: `Gelir-Gider (${user.email})`,
      issuer: 'Gelir-Gider App',
    })

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    })

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    }
  }

  async enable2FA(userId: string, code: string, secret: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    })

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code')
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    })

    this.logger.log(`2FA enabled for user: ${user.email}`)

    return { message: '2FA enabled successfully' }
  }

  async disable2FA(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new BadRequestException('Invalid password')
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })

    this.logger.log(`2FA disabled for user: ${user.email}`)

    return { message: '2FA disabled successfully' }
  }

  private async generateTokens(user: UserForToken): Promise<TokenResponse> {
    const accessPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    }

    const refreshPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
      jti: crypto.randomUUID(),
    }

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: this.JWT_ACCESS_EXPIRES_IN,
    })

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    })

    await this.storeRefreshSession(user.id, refreshToken)

    const emailVerified = await this.isEmailVerified(user.id)

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        twoFactorEnabled: user.twoFactorEnabled || false,
        emailVerified,
      },
    }
  }

  private async isEmailVerified(userId: string): Promise<boolean> {
    const verificationLog = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        action: 'email_verified',
        success: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return !!verificationLog
  }

  private createEmailVerificationToken(userId: string, email: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        type: 'email_verification',
      } satisfies TokenPayload,
      {
        secret: this.getEmailVerificationSecret(),
        expiresIn: this.EMAIL_VERIFICATION_EXPIRES_IN,
      },
    )
  }

  private createPasswordResetToken(userId: string, email: string, passwordHash: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        type: 'password_reset',
      } satisfies TokenPayload,
      {
        secret: this.getPasswordResetSecret(passwordHash),
        expiresIn: this.PASSWORD_RESET_EXPIRES_IN,
      },
    )
  }

  private getFrontendBaseUrl(): string {
    const raw = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
    return raw.replace(/\/+$/, '')
  }

  private getEmailVerificationSecret(): string {
    return process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET || 'email-verification-secret-dev'
  }

  private getPasswordResetSecret(passwordHash: string): string {
    const base = process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET || 'password-reset-secret-dev'
    return `${base}:${passwordHash}`
  }

  private buildRefreshSessionKey(userId: string): string {
    return `auth:refresh:${userId}`
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  private async storeRefreshSession(userId: string, refreshToken: string): Promise<void> {
    await this.cache.set(
      this.buildRefreshSessionKey(userId),
      this.hashToken(refreshToken),
      this.REFRESH_SESSION_TTL_SECONDS,
    )
  }

  private async assertActiveRefreshSession(userId: string, refreshToken: string): Promise<void> {
    const activeHash = await this.cache.get<string>(this.buildRefreshSessionKey(userId))
    if (!activeHash || activeHash !== this.hashToken(refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  private async revokeRefreshSession(userId: string): Promise<void> {
    await this.cache.del(this.buildRefreshSessionKey(userId))
  }

  private async revokeRefreshSessionFromToken(refreshToken?: string): Promise<void> {
    const token = refreshToken?.trim()
    if (!token) {
      return
    }

    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        ignoreExpiration: true,
      })

      if (payload.type === 'refresh' && payload.sub) {
        await this.revokeRefreshSession(payload.sub)
      }
    } catch {
      // Ignore invalid refresh tokens during logout; cookie clearing still proceeds.
    }
  }

  private async sendVerificationEmailSafe(userId: string, email: string, name?: string | null): Promise<void> {
    try {
      const token = this.createEmailVerificationToken(userId, email)
      const verifyUrl = `${this.getFrontendBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`

      await this.emailService.sendEmail({
        to: email,
        subject: 'Gelir-Gider E-posta Dogrulama',
        html: `
          <p>Merhaba${name ? ` ${name}` : ''},</p>
          <p>Hesabini dogrulamak icin asagidaki baglantiyi kullan:</p>
          <p><a href="${verifyUrl}">E-posta adresini dogrula</a></p>
          <p>Bu baglanti 24 saat gecerlidir.</p>
        `,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      this.logger.warn(`Verification email could not be sent for ${email}: ${message}`)
    }
  }
}
