import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, body } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userId = (request as any).user?.userId || 'anonymous';

    const startTime = Date.now();

    // Log request (exclude sensitive data)
    const sanitizedBody = this.sanitizeBody(body);
    this.logger.log(
      `[REQ] ${method} ${url} - User: ${userId} - IP: ${ip}`,
    );

    if (process.env.NODE_ENV === 'development' && Object.keys(sanitizedBody).length > 0) {
      this.logger.debug(`[REQ BODY] ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[RES] ${method} ${url} - ${response.statusCode} - ${duration}ms - User: ${userId}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[ERR] ${method} ${url} - ${error.status || 500} - ${duration}ms - User: ${userId} - ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return {};
    }

    const sensitiveFields = ['password', 'token', 'secret', 'sipPassword', 'access_token'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
