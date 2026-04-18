"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const filters_1 = require("./common/filters");
const interceptors_1 = require("./common/interceptors");
async function bootstrap() {
    const logger = new common_1.Logger("Bootstrap");
    const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
        logger.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
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
        logger.error("Refusing to start: JWT_SECRET is set to a default/weak value in production.");
        process.exit(1);
    }
    if (isProduction && (process.env.JWT_SECRET ?? "").length < 32) {
        logger.error("Refusing to start: JWT_SECRET must be at least 32 characters in production.");
        process.exit(1);
    }
    if (isProduction && process.env.CORS_ORIGIN === "*") {
        logger.error("Refusing to start: CORS_ORIGIN=* is not allowed in production.");
        process.exit(1);
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalFilters(new filters_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new interceptors_1.LoggingInterceptor());
    app.useStaticAssets((0, path_1.join)(__dirname, "..", "uploads"), {
        prefix: "/uploads/",
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:3001",
            "http://localhost:8000",
            "http://localhost",
            process.env.CORS_ORIGIN,
        ].filter((v) => Boolean(v)),
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Production Management System API")
        .setDescription("API для системы управления производством мебели")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("docs", app, document, {
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
//# sourceMappingURL=main.js.map