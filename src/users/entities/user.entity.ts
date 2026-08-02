import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A row in the "users" table. Each decorator maps a TS property to a DB column;
 * TypeORM uses this class to build queries AND (in dev) to create the table.
 * The `!` tells strict TypeScript "TypeORM assigns this, trust me."
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  // Never store the raw password. This holds the bcrypt hash (added next slice).
  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
