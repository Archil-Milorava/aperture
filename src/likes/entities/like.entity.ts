import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

/**
 * A "like" is the join row between a user and a post.
 * @Unique(['user', 'post']) enforces one like per user per post at the DB
 * level — so liking twice can't create a duplicate (idempotent by data model).
 */
@Entity('likes')
@Unique(['user', 'post'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
