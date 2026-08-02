import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

type HealthStatus = {
  status: 'ok';
  uptime: number;
  timestamp: string;
};

@ApiTags('Health')
@Controller('health')
export class HealthController {
  /**
   * Liveness check. Load balancers / container orchestrators (AWS ECS)
   * hit this to decide whether the instance is healthy.
   */
  @ApiOkResponse({
    description: 'Service is up; returns process uptime and current timestamp.',
  })
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
