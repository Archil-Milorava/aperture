import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

/**
 * forFeature([User]) registers a Repository<User> that we can inject into a
 * service to query the users table. The service + controller (register/login)
 * come in the next slice.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
})
export class UsersModule {}
