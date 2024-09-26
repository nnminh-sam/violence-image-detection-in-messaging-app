import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ApiLoggingInterceptor implements NestInterceptor {
  private logger: Logger = new Logger(ApiLoggingInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    const { method, originalUrl, body } = request;

    const start: number = Date.now();
    this.logger.log(`Incoming Request: ${method} ${originalUrl}`);

    return next.handle().pipe(
      tap((data) => {
        const end: number = Date.now();
        const executionTime = end - start;
        this.logger.log(`Outgoing Response: ${method} ${originalUrl}`);
        this.logger.log(`Execution Time: ${executionTime}ms`);
        this.logger.log(`Status Code: ${response.statusCode}`);
      }),
    );
  }
}
