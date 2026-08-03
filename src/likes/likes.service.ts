import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async like(userId: string, postId: string): Promise<void> {
    await this.assertPostExists(postId);

    const existing = await this.likesRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });
    if (existing) return; // already liked — idempotent no-op

    await this.likesRepository.save(
      this.likesRepository.create({
        user: { id: userId } as User,
        post: { id: postId } as Post,
      }),
    );
  }

  async unlike(userId: string, postId: string): Promise<void> {
    await this.assertPostExists(postId);
    // deleting a non-existent like is also a no-op — idempotent
    await this.likesRepository.delete({
      user: { id: userId },
      post: { id: postId },
    });
  }

  private async assertPostExists(postId: string): Promise<void> {
    const count = await this.postsRepository.count({ where: { id: postId } });
    if (count === 0) {
      throw new NotFoundException(`Post ${postId} not found`);
    }
  }
}
