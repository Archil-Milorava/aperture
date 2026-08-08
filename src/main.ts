import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded images statically, e.g. GET /uploads/<filename>.
  // (In Phase B these move to S3 and this line goes away.)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Validate every incoming request against its DTO. whitelist strips
  // properties that have no decorator; forbidNonWhitelisted rejects requests
  // that send unexpected properties; transform turns plain JSON into real DTO
  // instances (and coerces types, e.g. "3" -> 3).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Interactive, auto-generated API docs served at /api.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Aperture API')
    .setDescription('Media-sharing platform — senior-skills learning project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  // Pull the (already-validated) port from config rather than reading
  // process.env directly — one typed source of truth for configuration.
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // ⚠️ DELIBERATE ERROR to test CI — a string assigned to a number. Remove after.
  const deliberateBug: number = 'this is not a number';
  Logger.log(`deliberate bug: ${deliberateBug}`);

  await app.listen(port);
  Logger.log(`🚀 aperture is running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📚 API docs at http://localhost:${port}/api`, 'Bootstrap');
}
// `void` says "intentionally not awaiting" — satisfies the no-floating-promises
// lint rule and makes clear any startup error is handled by Node's default
// unhandled-rejection behavior (crash + non-zero exit), which is what we want.
void bootstrap();
