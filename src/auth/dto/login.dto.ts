import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;

  // No length rules here on purpose — login just needs a string; the password
  // policy is enforced at registration, not re-advertised at login.
  @ApiProperty({ example: 'super-secret-123' })
  @IsString()
  password!: string;
}
