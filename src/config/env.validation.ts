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

  // Database (PostgreSQL). No defaults on the credentials on purpose —
  // the app should refuse to start if they're missing.
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Auth (JWT)
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.number().default(3600), // access-token lifetime, in seconds
});
