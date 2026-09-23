import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WorkerModule } from './worker/worker.module';

// The WORKER entry point — separate from the HTTP app (main.ts). Instead of a
// hand-rolled kafkajs consumer, this boots a Nest MICROSERVICE: Nest connects
// to Kafka, subscribes to every topic named by an @EventPattern() below, and
// routes each message to the matching handler in PostCreatedConsumer. Started
// with:
//   node dist/worker                       (production)
//   nest start --watch --entryFile worker  (dev)
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    WorkerModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'aperture-worker',
          // Read directly from process.env: this runs before Nest's DI
          // container (and ConfigService) exist — same reasoning as
          // src/database/data-source.ts.
          brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
        },
        consumer: {
          groupId: 'post-worker',
        },
        // Nest appends '-server' to clientId/groupId by default, so a
        // microservice server never collides with a ClientKafka producer in
        // the same process. We don't have one here, and want the exact same
        // consumer group as the old hand-rolled consumer.
        postfixId: '',
      },
    },
  );
  app.enableShutdownHooks(); // so onModuleDestroy runs on shutdown
  await app.listen();
  Logger.log('🛠️  aperture worker started', 'Worker');
}
void bootstrap();
