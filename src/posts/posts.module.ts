import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Like } from '../likes/entities/like.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  // Post repo + Like repo (to count likes per post) + S3 storage
  imports: [TypeOrmModule.forFeature([Post, Like]), StorageModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
