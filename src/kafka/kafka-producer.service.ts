import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { KAFKA_CLIENT } from './kafka.constants';

/**
 * Publishes events to Kafka via Nest's ClientKafka. Other services inject this
 * and call publish() — they don't touch @nestjs/microservices directly (same
 * idea as RedisService).
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(@Inject(KAFKA_CLIENT) private readonly client: ClientKafka) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  /**
   * Send one event to a topic. `key` decides ordering/partitioning (events with
   * the same key stay in order); `value` is any JSON-serializable payload —
   * Nest's Kafka serializer JSON.stringifies it, same as the worker's
   * deserializer auto-parses it on the other end.
   *
   * client.emit() returns an Observable; firstValueFrom turns it into a plain
   * Promise, so a publish failure rejects normally and callers' existing
   * try/catch (e.g. PostsService.create) keeps working unchanged.
   */
  async publish(topic: string, key: string, value: unknown): Promise<void> {
    await firstValueFrom(this.client.emit(topic, { key, value }));
  }
}
