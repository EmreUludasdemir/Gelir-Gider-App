import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { LoginDto, RegisterDto, ChangePasswordDto, RefreshTokenDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

interface TokenPayload {
    sub: string;
    email: string;
    type: 'access' | 'refresh';
}

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        email: string;
        name?: string;
        twoFactorEnabled: boolean;
    };
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly JWT_ACCESS_EXPIRES_IN = '15m'; // 15 minutes
    private readonly JWT_REFRESH_EXPIRES_IN = '7d'; // 7 days

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        this.logger.log(`Attempting to register user: ${dto.email}`);

        // Check if user exists
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            throw new ConflictException('User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(dto.password, salt);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
            },
        });

        this.logger.log(`User registered successfully: ${user.email}`);

        // Return without password
        const { password, ...result } = user;
        return result;
    }

    async login(dto: LoginDto): Promise<TokenResponse> {
        this.logger.log(`Login attempt for: ${dto.email}`);

        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check 2FA
        if (user.twoFactorEnabled && user.twoFactorSecret) {
            if (!dto.twoFactorCode) {
                throw new UnauthorizedException('2FA code required');
            }

            const isValid = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: dto.twoFactorCode,
                window: 2, // Allow 2 time steps before/after
            });

            if (!isValid) {
                throw new UnauthorizedException('Invalid 2FA code');
            }
        }

        return this.generateTokens(user);
    }

    async refreshToken(dto: RefreshTokenDto): Promise<TokenResponse> {
        try {
            const payload = this.jwtService.verify<TokenPayload>(dto.refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            });

            if (payload.type !== 'refresh') {
                throw new UnauthorizedException('Invalid token type');
            }

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            return this.generateTokens(user);
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify old password
        const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        this.logger.log(`Password changed for user: ${user.email}`);

        return { message: 'Password changed successfully' };
    }

    async generate2FASecret(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const secret = speakeasy.generateSecret({
            name: `Gelir-Gider (${user.email})`,
            issuer: 'Gelir-Gider App',
        });

        // Store secret temporarily (not enabled yet)
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 },
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        return {
            secret: secret.base32,
            qrCode: qrCodeUrl,
        };
    }

    async enable2FA(userId: string, code: string, secret: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify the code
        const isValid = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: code,
            window: 2,
        });

        if (!isValid) {
            throw new BadRequestException('Invalid 2FA code');
        }

        // Enable 2FA
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
            },
        });

        this.logger.log(`2FA enabled for user: ${user.email}`);

        return { message: '2FA enabled successfully' };
    }

    async disable2FA(userId: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new BadRequestException('Invalid password');
        }

        // Disable 2FA
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });

        this.logger.log(`2FA disabled for user: ${user.email}`);

        return { message: '2FA disabled successfully' };
    }

    private async generateTokens(user: any): Promise<TokenResponse> {
        const accessPayload: TokenPayload = {
            sub: user.id,
            email: user.email,
            type: 'access',
        };

        const refreshPayload: TokenPayload = {
            sub: user.id,
            email: user.email,
            type: 'refresh',
        };

        const accessToken = this.jwtService.sign(accessPayload, {
            expiresIn: this.JWT_ACCESS_EXPIRES_IN,
        });

        const refreshToken = this.jwtService.sign(refreshPayload, {
            secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60, // 15 minutes in seconds
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                twoFactorEnabled: user.twoFactorEnabled || false,
            },
        };
    }
}

// Add NotFoundException import
import { NotFoundException } from '@nestjs/common';
