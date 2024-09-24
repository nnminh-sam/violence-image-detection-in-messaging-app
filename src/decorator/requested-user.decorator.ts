import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestedUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request: any = context.switchToHttp().getRequest();
    return request.user;
  },
);
