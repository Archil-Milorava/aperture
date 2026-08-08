import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post as HttpPost,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { multerImageOptions } from './multer.config';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly storageService: StorageService,
  ) {}

  @HttpPost() // aliased so it doesn't clash with the Post entity import
  @UseGuards(JwtAuthGuard) // must be logged in to post
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image', multerImageOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['caption', 'image'],
      properties: {
        caption: { type: 'string', example: 'Sunset at the beach 🌅' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Post created.' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Post> {
    if (!file) {
      throw new BadRequestException('An image file is required');
    }
    // upload the image to S3 first; store the returned object key on the post
    const imageKey = await this.storageService.uploadImage(file);
    // the author comes from the token, never from the request body
    return this.postsService.create(user.userId, dto, imageKey);
  }

  @Get()
  @ApiOkResponse({ description: 'The feed — all posts, newest first.' })
  findAll(): Promise<Post[]> {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Post> {
    return this.postsService.findById(id);
  }
}
