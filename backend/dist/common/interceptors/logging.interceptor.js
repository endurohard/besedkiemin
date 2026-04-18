"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger("HTTP");
    }
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const { method, url, body } = request;
        const userAgent = request.get("user-agent") || "";
        const ip = request.ip || request.headers["x-forwarded-for"] || "unknown";
        const userId = request.user?.userId || "anonymous";
        const startTime = Date.now();
        const sanitizedBody = this.sanitizeBody(body);
        this.logger.log(`[REQ] ${method} ${url} - User: ${userId} - IP: ${ip}`);
        if (process.env.NODE_ENV === "development" &&
            Object.keys(sanitizedBody).length > 0) {
            this.logger.debug(`[REQ BODY] ${JSON.stringify(sanitizedBody)}`);
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logger.log(`[RES] ${method} ${url} - ${response.statusCode} - ${duration}ms - User: ${userId}`);
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                this.logger.error(`[ERR] ${method} ${url} - ${error.status || 500} - ${duration}ms - User: ${userId} - ${error.message}`);
            },
        }));
    }
    sanitizeBody(body) {
        if (!body || typeof body !== "object") {
            return {};
        }
        const sensitiveFields = [
            "password",
            "token",
            "secret",
            "sipPassword",
            "access_token",
        ];
        const sanitized = { ...body };
        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = "[REDACTED]";
            }
        }
        return sanitized;
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map