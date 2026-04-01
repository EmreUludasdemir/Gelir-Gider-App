import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { setupHelmet, corsConfig, validateSecurityConfig } from './shared';

function reportBootstrapFailure(error: unknown) {
  const payload = {
    timestamp: new Date().toISOString(),
    level: 'error',
    context: 'Bootstrap',
    module: 'api',
    errorCode: 'BOOTSTRAP_FAILED',
    message: error instanceof Error ? error.message : 'Application failed to start',
    ...(error instanceof Error && error.stack ? { trace: error.stack } : {}),
  };

  process.stderr.write(`${JSON.stringify(payload)}\n`);
}

async function bootstrap() {
  validateSecurityConfig();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  setupHelmet(app);
  app.enableCors(corsConfig);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  const port = Number(process.env.PORT || process.env.API_PORT || 3001);
  await app.listen(port);

  logger.log(`API is running on http://localhost:${port}`, 'Bootstrap');
  logger.log('Security middleware enabled', 'Bootstrap');
  logger.log(`Health endpoint ready at http://localhost:${port}/health`, 'Bootstrap');
}

bootstrap().catch((error) => {
  reportBootstrapFailure(error);
  process.exit(1);
});
