import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Sunset at the beach 🌅', maxLength: 2200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2200)
  caption!: string;
}
