import * as Joi from 'joi';

/**
 * Schema for validating environment variables at startup.
 * If anything here is missing or the wrong type, the app throws before
 * it ever starts listening — you find out immediately, not in production.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
});
