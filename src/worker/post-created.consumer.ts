import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
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
 * Handles `post.created` events. Nest's Kafka microservice server (see
 * src/worker.ts) subscribes to a topic per @EventPattern below and routes
 * matching messages here — no manual connect/subscribe/parse required.
 */
@Controller()
export class PostCreatedConsumer {
  private readonly logger = new Logger(PostCreatedConsumer.name);

  constructor(private readonly storage: StorageService) {}

  @EventPattern('post.created')
  async handlePostCreated(@Payload() event: PostCreatedEvent): Promise<void> {
    this.logger.log(
      `📥 Received post.created for ${event.postId} — generating thumbnail…`,
    );
    await this.processPost(event);
    this.logger.log(`✅ Done processing post ${event.postId}`);
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
}
