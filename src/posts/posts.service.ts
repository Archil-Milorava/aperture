import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../users/entities/user.entity';
import { Like } from '../likes/entities/like.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
    private readonly storageService: StorageService,
  ) {}

  async create(
    authorId: string,
    dto: CreatePostDto,
    imageUrl: string,
  ): Promise<Post> {
    const post = this.postsRepository.create({
      caption: dto.caption,
      imageUrl,
      // set the FK by id only — no need to load the full user row
      author: { id: authorId } as User,
    });
    const saved = await this.postsRepository.save(post);
    // reload so the response includes the eager author + likeCount
    return this.findById(saved.id);
  }

  async findAll(): Promise<Post[]> {
    // newest first; author is eager-loaded by the entity
    const posts = await this.postsRepository.find({
      order: { createdAt: 'DESC' },
    });
    await this.attachLikeCounts(posts);
    // swap each stored S3 key for a temporary, viewable signed URL
    await Promise.all(
      posts.map(async (post) => {
        post.imageUrl = await this.storageService.getSignedImageUrl(
          post.imageUrl,
        );
      }),
    );
    return posts;
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }
    post.likeCount = await this.likesRepository.count({
      where: { post: { id } },
    });
    // swap the stored S3 key for a temporary, viewable signed URL
    post.imageUrl = await this.storageService.getSignedImageUrl(post.imageUrl);
    return post;
  }

  /**
   * Counts likes for many posts in ONE grouped query, then maps the result
   * back onto each post — avoids an N+1 (a separate count per post).
   */
  private async attachLikeCounts(posts: Post[]): Promise<void> {
    if (posts.length === 0) return;

    const rows = await this.likesRepository
      .createQueryBuilder('like')
      .leftJoin('like.post', 'post')
      .select('post.id', 'postId')
      .addSelect('COUNT(like.id)', 'count')
      .where('post.id IN (:...ids)', { ids: posts.map((p) => p.id) })
      .groupBy('post.id')
      .getRawMany<{ postId: string; count: string }>();

    const countByPost = new Map(rows.map((r) => [r.postId, Number(r.count)]));
    for (const post of posts) {
      post.likeCount = countByPost.get(post.id) ?? 0;
    }
  }
}
