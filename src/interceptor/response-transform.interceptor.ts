import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

// TODO: refactor this transformer
const extractDataFromRawData = (rawData) => {
  const { metadata, _doc, ...data } = rawData;
  let result = data;
  if (_doc != undefined) {
    const { _id, __v, ...rest } = _doc;
    result = {
      id: _id,
      ...rest,
    };
  }
  return {
    data: result,
    metadata,
  };
};

export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((rawData) => {
        let returningData = null;
        let metadata = null;

        if (Array.isArray(rawData)) {
          returningData = [];
          rawData.map((d) => {
            const { data, metadata } = extractDataFromRawData(d);
            returningData.push(data);
          });
        } else {
          const result = extractDataFromRawData(rawData);
          returningData = result.data;
          metadata = result.metadata;
        }

        return {
          data: returningData,
          metadata,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
