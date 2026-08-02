import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Put @UseGuards(JwtAuthGuard) on any route to require a valid JWT.
 * It triggers the JwtStrategy; missing/invalid/expired token -> 401.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
