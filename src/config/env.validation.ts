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

  // AWS / S3. In dev these point at LocalStack; in real AWS you'd drop
  // AWS_S3_ENDPOINT and supply real credentials.
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_S3_ENDPOINT: Joi.string().uri().optional(), // set for LocalStack; unset for real AWS
  AWS_S3_PUBLIC_ENDPOINT: Joi.string().uri().optional(), // browser-facing endpoint for signed URLs (LocalStack)
  AWS_S3_URL_EXPIRES: Joi.number().default(900), // signed URL lifetime, in seconds
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),

  // Redis (caching, rate limiting)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),

  // Kafka (event streaming)
  KAFKA_BROKER: Joi.string().default('localhost:9092'),
});
