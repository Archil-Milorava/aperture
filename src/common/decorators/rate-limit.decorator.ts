import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  limit: number; // max requests allowed...
  windowSeconds: number; // ...within this rolling window
}

export const RATE_LIMIT_KEY = 'rateLimit';

/**
 * Mark a route as rate-limited; enforced by RateLimitGuard (registered globally).
 * Routes without this decorator are not limited.
 *
 * Example: @RateLimit(5, 60) → at most 5 requests per 60s per client IP.
 */
export const RateLimit = (limit: number, windowSeconds: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowSeconds });
