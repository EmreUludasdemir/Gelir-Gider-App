import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'gelir-gider-api',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
