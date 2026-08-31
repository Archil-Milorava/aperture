import { Global, Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service';

// @Global so any module can inject KafkaProducerService without importing this.
@Global()
@Module({
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
