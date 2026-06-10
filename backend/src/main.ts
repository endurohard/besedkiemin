import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { GlobalExceptionFilter } from "./common/filters";
import { LoggingInterceptor } from "./common/interceptors";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // Validate required environment variables
  const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    logger.error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`,
    );
    process.exit(1);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const WEAK_JWT_SECRETS = new Set([
    "super-secret-jwt-key-change-in-production",
    "your-super-secret-jwt-key-change-in-production",
    "secret",
    "changeme",
  ]);

  if (isProduction && WEAK_JWT_SECRETS.has(process.env.JWT_SECRET ?? "")) {
    logger.error(
      "Refusing to start: JWT_SECRET is set to a default/weak value in production.",
    );
    process.exit(1);
  }

  if (isProduction && (process.env.JWT_SECRET ?? "").length < 32) {
    logger.error(
      "Refusing to start: JWT_SECRET must be at least 32 characters in production.",
    );
    process.exit(1);
  }

  if (isProduction && process.env.CORS_ORIGIN === "*") {
    logger.error(
      "Refusing to start: CORS_ORIGIN=* is not allowed in production.",
    );
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Запрещаем кэширование динамических API-ответов.
  // Иначе браузер отдаёт устаревшие данные (новые задачи/заказы не появляются
  // до перелогина). Статику в /uploads оставляем кэшируемой.
  app.getHttpAdapter().getInstance().set("etag", false);
  app.use((req: any, res: any, next: any) => {
    if (!req.path.startsWith("/uploads/")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global logging interceptor for request/response logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Глобальный префикс для всех API routes (кроме Swagger)
  // app.setGlobalPrefix('api');

  // Статическая раздача файлов из папки uploads
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
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
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3001",
      "http://localhost:8000", // Kong Gateway (development)
      "http://localhost", // Kong Gateway на порту 80
      process.env.CORS_ORIGIN,
    ].filter((v): v is string => Boolean(v)),
    credentials: true,
  });

  // Swagger на /docs (чтобы не конфликтовать с Kong /api маршрутом)
  const config = new DocumentBuilder()
    .setTitle("Production Management System API")
    .setDescription("API для системы управления производством мебели")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "Besedki EMIN API",
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
