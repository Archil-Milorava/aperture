import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Pull the (already-validated) port from config rather than reading
  // process.env directly — one typed source of truth for configuration.
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  Logger.log(`🚀 aperture is running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
