import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { NotFoundInterceptor } from '../interceptor/not-found-error.interceptor';

export function ThrowNotFoundException(message: string) {
  return applyDecorators(UseInterceptors(new NotFoundInterceptor(message)));
}
