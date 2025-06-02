import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import {
  PrismaModule,
  providePrismaClientExceptionFilter,
} from 'nestjs-prisma';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { TeamModule } from './modules/team/team.module';

@Module({
  imports: [
    ThrottlerModule.forRoot(),
    PrismaModule.forRoot({ isGlobal: true }),
    HealthModule,
    AuthModule,
    WorkspaceModule,
    TeamModule,
  ],
  controllers: [],
  providers: [providePrismaClientExceptionFilter()],
})
export class AppModule implements OnApplicationBootstrap {
  public onApplicationBootstrap() {
    Logger.log('Yasumu backend server has started!', 'Yasumu');
  }
}
