import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma.service';
import { AUTH_ACCESS_COOKIE, getCookieValue } from '../../shared/cookies';
import { getJwtSecret } from '../../shared';

interface JwtTokenPayload {
    sub: string;
    email: string;
    type: 'access' | 'refresh';
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (request: Request) => getCookieValue(request?.headers?.cookie, AUTH_ACCESS_COOKIE) || null,
            ]),
            ignoreExpiration: false,
            secretOrKey: getJwtSecret(),
        });
    }

    async validate(payload: JwtTokenPayload) {
        if (payload.type !== 'access') {
            throw new UnauthorizedException();
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        // Return user object which will be injected into request
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return { id: result.id, email: result.email };
    }
}
