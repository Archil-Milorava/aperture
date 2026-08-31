import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostCreatedConsumer } from './post-created.consumer';
import { StorageModule } from '../storage/storage.module';

/**
 * A minimal module for the WORKER process — no HTTP server, no database. It loads
 * env (no strict validation) and imports StorageModule so the consumer can read
 * originals from S3 and write thumbnails back.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), StorageModule],
  providers: [PostCreatedConsumer],
})
export class WorkerModule {}
