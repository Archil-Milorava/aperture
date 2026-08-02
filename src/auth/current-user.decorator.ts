import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './strategies/jwt.strategy';

/**
 * Pulls req.user (set by JwtStrategy.validate) into a handler parameter:
 *   me(@CurrentUser() user: AuthUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
