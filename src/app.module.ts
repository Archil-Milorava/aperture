import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { LikesModule } from './likes/likes.module';
import { RedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    // Loads .env, validates it against our schema, and makes ConfigService
    // available everywhere (isGlobal) without re-importing in each module.
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    // Connect to Postgres. forRootAsync lets us read the (already-validated)
    // connection settings from ConfigService instead of hardcoding them.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        // Managed databases like AWS RDS require encrypted (SSL) connections.
        // Enable it with DB_SSL=true; rejectUnauthorized:false accepts RDS's cert
        // without us bundling its CA — still encrypted, just not CA-verified.
        ssl:
          config.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        // Migrations now own the schema. Never synchronize — it can silently
        // drop columns/data. Apply changes with: npm run migration:run
        synchronize: false,
      }),
    }),
    RedisModule,
    KafkaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    PostsModule,
    LikesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Activates @Exclude()/@Expose() on returned entities, so responses never
    // leak sensitive fields like passwordHash. Registered globally.
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    // Enforces @RateLimit(...) on any route that declares it.
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
