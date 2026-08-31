import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka } from 'kafkajs';
import sharp from 'sharp';
import { StorageService } from '../storage/storage.service';

interface PostCreatedEvent {
  postId: string;
  authorId: string;
  caption: string;
  imageKey: string;
  occurredAt: string;
}

/**
 * Consumes `post.created` events and does background work. Runs in the WORKER
 * process (see src/worker.ts), completely separate from the HTTP app.
 */
@Injectable()
export class PostCreatedConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostCreatedConsumer.name);
  private readonly consumer: Consumer;

  constructor(
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {
    const kafka = new Kafka({
      clientId: 'aperture-worker',
      brokers: [this.config.get<string>('KAFKA_BROKER')!],
    });
    // A consumer GROUP: run several workers with the same groupId and Kafka
    // splits messages among them (each handled once). That's how you scale
    // background processing horizontally.
    this.consumer = kafka.consumer({ groupId: 'post-worker' });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'post.created',
      fromBeginning: false, // only new events, not the whole history
    });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(
          message.value?.toString() ?? '{}',
        ) as PostCreatedEvent;
        this.logger.log(
          `📥 Received post.created for ${event.postId} — generating thumbnail…`,
        );
        await this.processPost(event);
        this.logger.log(`✅ Done processing post ${event.postId}`);
      },
    });
    this.logger.log('Worker is consuming post.created');
  }

  // Real background work: download the original image from S3, shrink it, and
  // save the thumbnail back to S3 under a thumbnails/ key.
  private async processPost(event: PostCreatedEvent): Promise<void> {
    const original = await this.storage.getObject(event.imageKey);
    // 256px wide, height kept in proportion, re-encoded as JPEG
    const thumbnail = await sharp(original)
      .resize({ width: 256 })
      .jpeg()
      .toBuffer();

    const name =
      event.imageKey
        .split('/')
        .pop()
        ?.replace(/\.\w+$/, '') ?? event.postId;
    const thumbKey = `thumbnails/${name}.jpg`;
    await this.storage.putObject(thumbKey, thumbnail, 'image/jpeg');
    this.logger.log(`🖼️  Thumbnail saved to ${thumbKey}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }
}
