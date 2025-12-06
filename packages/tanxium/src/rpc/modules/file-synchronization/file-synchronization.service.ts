import { EventBus, Injectable, OnModuleInit } from '@yasumu/den';
import { FsSyncEvent } from '../common/events/fs-sync.event.ts';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { WorkspacesService } from '../workspaces/workspaces.service.ts';
import { YslService } from './ysl.service.ts';

@Injectable()
export class FileSynchronizationService implements OnModuleInit {
  public constructor(
    private readonly eventBus: EventBus,
    private readonly connection: TransactionalConnection,
    private readonly workspaceService: WorkspacesService,
    private readonly yslService: YslService,
  ) {}

  public onModuleInit() {
    this.eventBus
      .ofType(FsSyncEvent)
      .filter((event) => event.ctx.workspaceId !== null)
      .subscribe((event) => {
        return this.synchronizeWorkspace(event.ctx.workspaceId!);
      });
  }

  private async synchronizeWorkspace(workspaceId: string) {
    const workspace = await this.workspaceService.findOneById(workspaceId);
    if (!workspace) return;
  }
}
