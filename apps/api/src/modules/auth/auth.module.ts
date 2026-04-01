import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma.service';
import { JwtStrategy } from './jwt.strategy';
import { EmailService } from '../notifications/email.service';
import { SecurityConfig } from '../../shared';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: SecurityConfig.jwt.secret,
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, PrismaService, JwtStrategy, EmailService],
    exports: [AuthService],
})
export class AuthModule { }
