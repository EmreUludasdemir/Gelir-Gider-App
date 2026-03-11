import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        if (typeof data === 'string') {
            return request.user?.[data];
        }
        return request.user;
    },
);
