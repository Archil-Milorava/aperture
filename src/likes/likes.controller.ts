import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post as HttpPost,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Likes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // both routes require a logged-in user
@Controller('posts/:postId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @HttpPost()
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'Post liked (liking again is a no-op).',
  })
  like(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.likesService.like(user.userId, postId);
  }

  @Delete()
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Like removed.' })
  unlike(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.likesService.unlike(user.userId, postId);
  }
}
