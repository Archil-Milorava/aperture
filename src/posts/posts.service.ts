import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
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
    // reload so the response includes the eager-loaded author
    return this.findById(saved.id);
  }

  findAll(): Promise<Post[]> {
    // newest first; the author is eager-loaded by the entity
    return this.postsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }
    return post;
  }
}
