import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  details?: any;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle HTTP exceptions (NestJS built-in)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string;
      let details: any;

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object") {
        const res = exceptionResponse as any;
        message = res.message || exception.message;
        details = res.error ? undefined : res;
      } else {
        message = exception.message;
      }

      return {
        statusCode: status,
        message: Array.isArray(message) ? message[0] : message,
        error: this.getErrorName(status),
        timestamp,
        path,
        details:
          Array.isArray(message) && message.length > 1 ? message : details,
      };
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, timestamp, path);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Ошибка валидации данных",
        error: "Bad Request",
        timestamp,
        path,
      };
    }

    // Handle unknown errors
    const unknownError = exception as Error;
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        process.env.NODE_ENV === "production"
          ? "Внутренняя ошибка сервера"
          : unknownError?.message || "Неизвестная ошибка",
      error: "Internal Server Error",
      timestamp,
      path,
    };
  }

  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
  ): ErrorResponse {
    switch (exception.code) {
      case "P2002": // Unique constraint violation
        const target = (exception.meta?.target as string[]) || [];
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `Запись с такими данными уже существует: ${target.join(", ")}`,
          error: "Conflict",
          timestamp,
          path,
        };

      case "P2025": // Record not found
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "Запись не найдена",
          error: "Not Found",
          timestamp,
          path,
        };

      case "P2003": // Foreign key constraint failed
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Связанная запись не найдена",
          error: "Bad Request",
          timestamp,
          path,
        };

      case "P2014": // Relation violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Невозможно удалить запись: существуют связанные данные",
          error: "Bad Request",
          timestamp,
          path,
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            process.env.NODE_ENV === "production"
              ? "Ошибка базы данных"
              : `Database error: ${exception.code}`,
          error: "Internal Server Error",
          timestamp,
          path,
        };
    }
  }

  private getErrorName(status: number): string {
    const statusNames: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      409: "Conflict",
      422: "Unprocessable Entity",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
    };

    return statusNames[status] || "Error";
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ): void {
    const logMessage = {
      method: request.method,
      url: request.url,
      statusCode: errorResponse.statusCode,
      message: errorResponse.message,
      userId: (request as any).user?.userId,
      userAgent: request.headers["user-agent"],
      ip: request.ip || request.headers["x-forwarded-for"],
    };

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `[${logMessage.method}] ${logMessage.url} - ${errorResponse.statusCode}: ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(
        `[${logMessage.method}] ${logMessage.url} - ${errorResponse.statusCode}: ${errorResponse.message}`,
      );
    }
  }
}
