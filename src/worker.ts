import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker/worker.module';

// The WORKER entry point — separate from the HTTP app (main.ts). It has no web
// server; it just runs the Kafka consumer. Started with:
//   node dist/worker                    (production)
//   nest start --watch --entryFile worker  (dev)
async function bootstrap() {
  // createApplicationContext boots Nest's DI WITHOUT an HTTP server.
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks(); // so onModuleDestroy runs on shutdown
  Logger.log('🛠️  aperture worker started', 'Worker');
}
void bootstrap();
