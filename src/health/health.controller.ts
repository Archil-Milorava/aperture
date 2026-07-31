import { Controller, Get } from '@nestjs/common';

type HealthStatus = {
  status: 'ok';
  uptime: number;
  timestamp: string;
};

@Controller('health')
export class HealthController {
  /**
   * Liveness check. Load balancers / container orchestrators (AWS ECS)
   * hit this to decide whether the instance is healthy.
   */
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
