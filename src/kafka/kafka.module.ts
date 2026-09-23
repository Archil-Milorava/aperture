import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaProducerService } from './kafka-producer.service';
import { KAFKA_CLIENT } from './kafka.constants';

// @Global so any module can inject KafkaProducerService without importing this.
@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENT,
        // useFactory (not a plain object) because we need ConfigService,
        // which only exists once Nest's DI container is up.
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'aperture-app',
              brokers: [config.get<string>('KAFKA_BROKER')!],
            },
            // We only ever emit() (fire-and-forget), never send() — this skips
            // Nest setting up a reply consumer/group we'd never use.
            producerOnlyMode: true,
            // Keep the exact clientId above — Nest appends '-client' otherwise.
            postfixId: '',
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
