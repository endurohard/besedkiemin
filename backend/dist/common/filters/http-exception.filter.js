"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errorResponse = this.buildErrorResponse(exception, request);
        this.logError(exception, request, errorResponse);
        response.status(errorResponse.statusCode).json(errorResponse);
    }
    buildErrorResponse(exception, request) {
        const timestamp = new Date().toISOString();
        const path = request.url;
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            let message;
            let details;
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                const res = exceptionResponse;
                message = res.message || exception.message;
                details = res.error ? undefined : res;
            }
            else {
                message = exception.message;
            }
            return {
                statusCode: status,
                message: Array.isArray(message) ? message[0] : message,
                error: this.getErrorName(status),
                timestamp,
                path,
                details: Array.isArray(message) && message.length > 1 ? message : details,
            };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return this.handlePrismaError(exception, timestamp, path);
        }
        if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: 'Ошибка валидации данных',
                error: 'Bad Request',
                timestamp,
                path,
            };
        }
        const unknownError = exception;
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: process.env.NODE_ENV === 'production'
                ? 'Внутренняя ошибка сервера'
                : unknownError?.message || 'Неизвестная ошибка',
            error: 'Internal Server Error',
            timestamp,
            path,
        };
    }
    handlePrismaError(exception, timestamp, path) {
        switch (exception.code) {
            case 'P2002':
                const target = exception.meta?.target || [];
                return {
                    statusCode: common_1.HttpStatus.CONFLICT,
                    message: `Запись с такими данными уже существует: ${target.join(', ')}`,
                    error: 'Conflict',
                    timestamp,
                    path,
                };
            case 'P2025':
                return {
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    message: 'Запись не найдена',
                    error: 'Not Found',
                    timestamp,
                    path,
                };
            case 'P2003':
                return {
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Связанная запись не найдена',
                    error: 'Bad Request',
                    timestamp,
                    path,
                };
            case 'P2014':
                return {
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Невозможно удалить запись: существуют связанные данные',
                    error: 'Bad Request',
                    timestamp,
                    path,
                };
            default:
                return {
                    statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: process.env.NODE_ENV === 'production'
                        ? 'Ошибка базы данных'
                        : `Database error: ${exception.code}`,
                    error: 'Internal Server Error',
                    timestamp,
                    path,
                };
        }
    }
    getErrorName(status) {
        const statusNames = {
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            409: 'Conflict',
            422: 'Unprocessable Entity',
            429: 'Too Many Requests',
            500: 'Internal Server Error',
            502: 'Bad Gateway',
            503: 'Service Unavailable',
        };
        return statusNames[status] || 'Error';
    }
    logError(exception, request, errorResponse) {
        const logMessage = {
            method: request.method,
            url: request.url,
            statusCode: errorResponse.statusCode,
            message: errorResponse.message,
            userId: request.user?.userId,
            userAgent: request.headers['user-agent'],
            ip: request.ip || request.headers['x-forwarded-for'],
        };
        if (errorResponse.statusCode >= 500) {
            this.logger.error(`[${logMessage.method}] ${logMessage.url} - ${errorResponse.statusCode}: ${errorResponse.message}`, exception instanceof Error ? exception.stack : undefined);
        }
        else if (errorResponse.statusCode >= 400) {
            this.logger.warn(`[${logMessage.method}] ${logMessage.url} - ${errorResponse.statusCode}: ${errorResponse.message}`);
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map