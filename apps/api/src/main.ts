import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log('');
  console.log('🚀 Gelir-Gider API is running!');
  console.log(`📡 Server: http://localhost:${port}`);
  console.log(`🏥 Health: http://localhost:${port}/health`);
  console.log(`📊 Transactions: http://localhost:${port}/transactions`);
  console.log(`📈 Summary: http://localhost:${port}/transactions/summary`);
  console.log('');
}

bootstrap();
