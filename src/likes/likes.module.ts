import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Post } from '../posts/entities/post.entity';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';

@Module({
  // Like repo (to like/unlike) + Post repo (to check the post exists)
  imports: [TypeOrmModule.forFeature([Like, Post])],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
