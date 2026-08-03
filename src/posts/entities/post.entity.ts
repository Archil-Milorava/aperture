import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Like } from '../../likes/entities/like.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  caption!: string;

  @Column({ name: 'image_url' })
  imageUrl!: string;

  // Each post belongs to one user (a user has many posts).
  // eager: load the author automatically whenever we fetch posts.
  // onDelete CASCADE: deleting a user removes their posts too.
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Inverse side of Like.post — adds NO column; lets us count likes per post.
  @OneToMany(() => Like, (like) => like.post)
  likes!: Like[];

  // Filled in by loadRelationCountAndMap in queries (not a stored column).
  likeCount?: number;
}
