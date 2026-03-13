import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
    Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
    LoginDto,
    RegisterDto,
    RefreshTokenDto,
    ChangePasswordDto,
    RequestPasswordResetDto,
    ConfirmPasswordResetDto,
    RequestEmailVerificationDto,
    ConfirmEmailVerificationDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './user.decorator';
import {
    AUTH_REFRESH_COOKIE,
    clearAuthCookies,
    getCookieValue,
    setAuthCookies,
} from '../../shared/cookies';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const tokens = await this.authService.login(dto);
        setAuthCookies(response, tokens);
        return tokens;
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refresh(
        @Body() dto: RefreshTokenDto,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const refreshToken = getCookieValue(request.headers.cookie, AUTH_REFRESH_COOKIE);
        const tokens = await this.authService.refreshToken(dto, refreshToken);
        setAuthCookies(response, tokens);
        return tokens;
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@User('id') userId: string) {
        return this.authService.getProfile(userId);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const refreshToken = getCookieValue(request.headers.cookie, AUTH_REFRESH_COOKIE);
        await this.authService.logout(refreshToken);
        clearAuthCookies(response);
        return { message: 'Logout successful' };
    }

    @HttpCode(HttpStatus.OK)
    @Post('password-reset/request')
    requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
        return this.authService.requestPasswordReset(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('password-reset/confirm')
    confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
        return this.authService.confirmPasswordReset(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('email-verification/request')
    requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
        return this.authService.requestEmailVerification(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('email-verification/confirm')
    confirmEmailVerification(@Body() dto: ConfirmEmailVerificationDto) {
        return this.authService.confirmEmailVerification(dto);
    }

    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('change-password')
    changePassword(@User('id') userId: string, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('2fa/generate')
    generate2FA(@User('id') userId: string) {
        return this.authService.generate2FASecret(userId);
    }

    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('2fa/enable')
    enable2FA(
        @User('id') userId: string,
        @Body() body: { code: string; secret: string },
    ) {
        return this.authService.enable2FA(userId, body.code, body.secret);
    }

    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('2fa/disable')
    disable2FA(@User('id') userId: string, @Body() body: { password: string }) {
        return this.authService.disable2FA(userId, body.password);
    }
}
