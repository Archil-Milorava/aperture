import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../users/entities/user.entity';
import { Like } from '../likes/entities/like.entity';
import { StorageService } from '../storage/storage.service';
import { RedisService } from '../redis/redis.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

// The feed is cached under this key for a short time (seconds). Kept short so
// new likes show up quickly; new posts bust the cache immediately (see create).
const FEED_CACHE_KEY = 'posts:feed';
const FEED_CACHE_TTL = 30;

// Kafka topic we publish to when a post is created (a worker consumes it).
const POST_CREATED_TOPIC = 'post.created';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
    private readonly storageService: StorageService,
    private readonly redis: RedisService,
    private readonly kafka: KafkaProducerService,
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
    // a new post changes the feed → drop the cached copy so it's rebuilt
    await this.redis.del(FEED_CACHE_KEY);

    // Publish an event so background workers can react (thumbnails, notifications…).
    // Fire-and-forget: the post is already saved, so a Kafka failure must NOT fail
    // the user's request — we just log it.
    try {
      await this.kafka.publish(POST_CREATED_TOPIC, saved.id, {
        postId: saved.id,
        authorId,
        caption: saved.caption,
        imageKey: saved.imageUrl,
        occurredAt: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.warn(`Failed to publish ${POST_CREATED_TOPIC}: ${err}`);
    }

    // reload so the response includes the eager author + likeCount
    return this.findById(saved.id);
  }

  async findAll(): Promise<Post[]> {
    const posts = await this.getCachedFeed();
    // Signed URLs are generated fresh every request (never cached) — they
    // expire, so a cached one could be dead by the time it's served.
    await Promise.all(
      posts.map(async (post) => {
        post.imageUrl = await this.storageService.getSignedImageUrl(
          post.imageUrl,
        );
      }),
    );
    return posts;
  }

  /**
   * The feed's DB work (query + like counts) is the expensive, cacheable part.
   * We store the posts (with their raw S3 keys, no signed URLs) in Redis for a
   * short TTL. On a HIT we skip Postgres entirely.
   */
  private async getCachedFeed(): Promise<Post[]> {
    const cached = await this.redis.get(FEED_CACHE_KEY);
    if (cached) {
      this.logger.log('feed: cache HIT');
      return JSON.parse(cached) as Post[];
    }
    this.logger.log('feed: cache MISS — querying Postgres');
    const posts = await this.postsRepository.find({
      order: { createdAt: 'DESC' },
    });
    await this.attachLikeCounts(posts);
    await this.redis.set(FEED_CACHE_KEY, JSON.stringify(posts), FEED_CACHE_TTL);
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
