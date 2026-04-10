import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export type RequestUser = {
  sub: string;
  email: string;
  role: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    return request.user;
  },
);
