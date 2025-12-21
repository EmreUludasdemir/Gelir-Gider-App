import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
    LoginDto,
    RegisterDto,
    RefreshTokenDto,
    ChangePasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto);
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
