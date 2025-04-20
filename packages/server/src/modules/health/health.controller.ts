import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class HealthController {
  @Get('/')
  public healthCheck() {
    return { status: 'ok' };
  }
}
