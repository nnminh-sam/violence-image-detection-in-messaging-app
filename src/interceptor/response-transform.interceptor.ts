import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((rawData) => {
        if (!rawData) {
          return {
            timestamp: new Date().toISOString(),
          };
        }

        let { data, metadata, ...rest } = rawData;

        if (!data && !metadata) {
          data = rest._doc ? rest._doc : rest;
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
