import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { SecurityConfig } from '../../shared';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: SecurityConfig.jwt.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
