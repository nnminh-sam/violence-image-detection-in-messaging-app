import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((rawData) => {
        let { data, metadata, ...rest } = rawData;

        if (!data && !metadata) {
          data = rest;
          metadata = undefined;
        }

        return {
          data,
          metadata,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
