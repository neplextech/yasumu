import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import {
  PrismaModule,
  providePrismaClientExceptionFilter,
} from 'nestjs-prisma';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot(),
    PrismaModule.forRoot({ isGlobal: true }),
    HealthModule,
  ],
  controllers: [],
  providers: [providePrismaClientExceptionFilter()],
})
export class AppModule implements OnApplicationBootstrap {
  public onApplicationBootstrap() {
    Logger.log('Yasumu backend server has started!', 'Yasumu');
  }
}
