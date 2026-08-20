import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RedisService } from '../../redis/redis.service';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';

/**
 * Global guard enforcing @RateLimit on routes that declare it, using Redis as a
 * shared counter. Strategy: a "fixed window" — INCR a per-client key, set it to
 * expire after the window on the first hit, and reject once it exceeds the limit.
 * Because the counter lives in Redis (not app memory), it works even across
 * multiple app instances.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const opts = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!opts) return true; // route isn't rate-limited → let it through

    const req = context.switchToHttp().getRequest<Request>();
    const clientIp = req.ip ?? 'unknown';
    // one counter per (route + client); route id keeps it param-free
    const routeId = `${context.getClass().name}.${context.getHandler().name}`;
    const key = `rl:${routeId}:${clientIp}`;

    try {
      const client = this.redis.getClient();
      const count = await client.incr(key);
      if (count === 1) {
        // first request in this window → start the expiry countdown
        await client.expire(key, opts.windowSeconds);
      }
      if (count > opts.limit) {
        const retryIn = await client.ttl(key);
        throw new HttpException(
          `Too many requests. Try again in ${retryIn}s.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return true;
    } catch (err) {
      if (err instanceof HttpException) throw err; // re-throw our 429
      // If Redis is unreachable, fail OPEN (allow) rather than block all traffic.
      this.logger.error(`Rate limiter unavailable, allowing request: ${err}`);
      return true;
    }
  }
}
