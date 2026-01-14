import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { setupHelmet, corsConfig, validateSecurityConfig } from './shared';
import { validateEnv, getEnvConfig } from './config/env.validation';

async function bootstrap() {
  // Validate environment variables at startup
  const envConfig = validateEnv();

  // Validate security configuration before starting
  validateSecurityConfig();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until Winston is ready
  });

  // Use Winston logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Setup Helmet security headers
  setupHelmet(app);

  // Enable CORS with enhanced configuration
  app.enableCors(corsConfig);

  // Enable validation with transformation
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

  const port = envConfig.PORT;
  await app.listen(port);

  logger.log(`🚀 Gelir-Gider API is running on http://localhost:${port}`, 'Bootstrap');
  logger.log(`🌍 Environment: ${envConfig.NODE_ENV}`, 'Bootstrap');
  logger.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`, 'Bootstrap');
  logger.log(`🏥 Health: http://localhost:${port}/health`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
