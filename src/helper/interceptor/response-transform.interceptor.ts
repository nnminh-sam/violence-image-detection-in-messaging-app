import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((rawData) => {
        let transformedData = rawData;
        if ('_doc' in rawData) {
          const { _doc } = rawData;
          const { _id, __v, ...data } = _doc;
          transformedData = {
            id: rawData._id,
            ...data,
          };
        }

        return {
          data: transformedData,
          metadata: {},
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
