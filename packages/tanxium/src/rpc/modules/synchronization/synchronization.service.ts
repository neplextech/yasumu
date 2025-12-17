import { EventBus, Injectable, OnModuleInit } from '@yasumu/den';
import { FsSyncEvent } from '../common/events/fs-sync.event.ts';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { WorkspacesService } from '../workspaces/workspaces.service.ts';
import { YslService } from './ysl.service.ts';
import { WorkspaceSchema } from './schema/workspace.schema.ts';
import { YasumuAnnotations } from './schema/constants.ts';
import { WorkspaceData } from '@yasumu/common';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { RestService } from '../rest/rest.service.ts';
import { EntityGroupService } from '../entity-group/entity-group.service.ts';
import { RestSchema } from './schema/rest.schema.ts';
import { Infer } from '@yasumu/schema';
import { isDefaultWorkspacePath } from '../../common/constants.ts';

@Injectable()
export class SynchronizationService implements OnModuleInit {
  public constructor(
    private readonly eventBus: EventBus,
    private readonly connection: TransactionalConnection,
    private readonly workspaceService: WorkspacesService,
    private readonly yslService: YslService,
    private readonly restService: RestService,
    private readonly entityGroupService: EntityGroupService,
  ) {}

  public onModuleInit() {
    this.eventBus
      .ofType(FsSyncEvent)
      .filter((event) => event.ctx.workspaceId !== null)
      .subscribe((event) => {
        return this.synchronizeWorkspace(event.ctx.workspaceId!);
      });
  }

  private getPath(workspace: WorkspaceData, target: 'workspace' | 'rest') {
    const root = join(workspace.path, 'yasumu');
    switch (target) {
      case 'workspace':
        return root;
      case 'rest':
        return join(root, 'rest');
      default:
        return target satisfies never;
    }
  }

  private async ensurePath(path: string) {
    if (!existsSync(path)) {
      await Deno.mkdir(path, { recursive: true });
    }
  }

  private async synchronizeWorkspace(workspaceId: string) {
    const workspace = await this.workspaceService.findOneById(workspaceId);

    console.log({ synchronization: workspace });
    if (!workspace) return;

    // default workspaces cannot be synchronized
    // as they exist more as a "scratch pad" for the user
    // and do not have a valid path
    if (isDefaultWorkspacePath(workspace.path)) return;

    const snapshot = Date.now(); // TODO: use a more robust snapshot id

    const groups = await this.entityGroupService
      .findAll(workspaceId)
      .catch(() => []);

    const workspaceContent = this.yslService.serialize(WorkspaceSchema, {
      annotation: YasumuAnnotations.Workspace,
      blocks: {
        metadata: {
          name: workspace.name,
          version: workspace.version,
        },
        groups: groups.reduce(
          (acc, group) => {
            acc[group.id] = {
              id: group.id,
              name: group.name,
              entity: group.entityType,
              parentId: group.parentId,
              workspaceId: group.workspaceId,
            };
            return acc;
          },
          {} as Infer<typeof WorkspaceSchema>['blocks']['groups'],
        ),
        snapshot,
      },
    });

    const workspaceDir = this.getPath(workspace, 'workspace');
    await this.ensurePath(workspaceDir);

    await this.yslService.emit(
      workspaceContent,
      join(workspaceDir, 'workspace.ysl'),
    );

    const restEntities = await this.restService.list(workspaceId);

    const restDir = this.getPath(workspace, 'rest');
    await this.ensurePath(restDir);

    for (const restEntity of restEntities) {
      const destination = join(restDir, restEntity.id + '.ysl');
      await this.yslService.emit(
        this.yslService.serialize(RestSchema, {
          annotation: YasumuAnnotations.Rest,
          blocks: {
            dependencies: [],
            metadata: {
              groupId: restEntity.groupId,
              id: restEntity.id,
              method: restEntity.method,
              name: restEntity.name,
            },
            request: {
              body: null,
              headers: restEntity.requestHeaders ?? [],
              url: restEntity.url,
            },
            script: null,
            test: null,
          },
        }),
        destination,
      );
    }
  }
}
