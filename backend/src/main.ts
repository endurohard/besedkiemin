import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { GlobalExceptionFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }

  // Warn about default JWT secret in production
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'super-secret-jwt-key-change-in-production') {
    logger.warn('WARNING: Using default JWT_SECRET in production. Please change it!');
  }

  // Warn about wildcard CORS in production
  if (process.env.NODE_ENV === 'production' && process.env.CORS_ORIGIN === '*') {
    logger.warn('WARNING: CORS_ORIGIN=* in production. Set to your actual domain!');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global logging interceptor for request/response logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Глобальный префикс для всех API routes (кроме Swagger)
  // app.setGlobalPrefix('api');

  // Статическая раздача файлов из папки uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS - разрешаем все localhost порты в dev режиме
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3001',
      'http://localhost:8000', // Kong Gateway (development)
      'http://localhost',      // Kong Gateway на порту 80
      process.env.CORS_ORIGIN
    ].filter(Boolean),
    credentials: true,
  });

  // Swagger на /docs (чтобы не конфликтовать с Kong /api маршрутом)
  const config = new DocumentBuilder()
    .setTitle('Production Management System API')
    .setDescription('API для системы управления производством мебели')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Besedki EMIN API',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();
