import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Shape + rules for the register request body. The ValidationPipe checks every
 * incoming POST /users against these decorators BEFORE the controller runs;
 * @nestjs/swagger reads them to document the endpoint. One class, two payoffs.
 */
export class CreateUserDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'super-secret-123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt only reads the first 72 bytes; cap it so nothing is silently truncated
  password!: string;
}
