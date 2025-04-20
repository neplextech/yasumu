import type { YasumuWorkspace } from '@/YasumuWorkspace.js';
import { WorkspaceModuleType } from './constants.js';
import { IndexNotFoundError } from '@/common/errors/IndexNotFoundError.js';
import { EntityNotFoundError } from '@/common/errors/EntityNotFoundError.js';
import type { YasumuEntityDataMap, YasumuEntityTree } from './types.js';
import type {
  YasumuSchemaParsableScript,
  YasumuSchemaActions,
  _YasumuSchemaParsableScriptExpect,
} from '@yasumu/schema';
import type { BaseEntity } from './BaseEntity.js';
import type { YasumuStandaloneFormat } from '@/standalone/types.js';
import type { RootIndex } from '@/YasumuWorkspaceMetadata.js';
import { YasumuWorkspaceEvents } from '@/events/common.js';
import type { YasumuEntityMap } from './entities.js';

export abstract class YasumuBaseModule<
  T extends WorkspaceModuleType = WorkspaceModuleType,
> {
  /**
   * The type of this module.
   */
  public abstract readonly type: T;
  /**
   * The schema for the entities in this module.
   */
  public abstract readonly schema: YasumuSchemaActions<
    YasumuSchemaParsableScript<_YasumuSchemaParsableScriptExpect>
  >;

  /**
   * The base module for Yasumu.
   * @param workspace The current workspace.
   */
  public constructor(public readonly workspace: YasumuWorkspace) {}

  /**
   * Whether this module is a REST module.
   */
  public isRest(): this is YasumuEntityMap[(typeof WorkspaceModuleType)['Rest']] {
    return this.type === WorkspaceModuleType.Rest;
  }

  /**
   * Whether this module is a GraphQL module.
   */
  public isGraphQL(): this is YasumuEntityMap[(typeof WorkspaceModuleType)['GraphQL']] {
    return this.type === WorkspaceModuleType.GraphQL;
  }

  /**
   * Whether this module is an smtp module.
   */
  public isSMTP(): this is YasumuEntityMap[(typeof WorkspaceModuleType)['SMTP']] {
    return this.type === WorkspaceModuleType.SMTP;
  }

  /**
   * Whether this module is a socket.io module.
   */
  public isSocketIO(): this is YasumuEntityMap[(typeof WorkspaceModuleType)['SocketIO']] {
    return this.type === WorkspaceModuleType.SocketIO;
  }

  /**
   * Whether this module is a websocket module.
   */
  public isWebsocket(): this is YasumuEntityMap[(typeof WorkspaceModuleType)['Websocket']] {
    return this.type === WorkspaceModuleType.Websocket;
  }

  /**
   * Whether this module is an SSE module.
   */
  public isSSE(): this is YasumuEntityMap[(typeof WorkspaceModuleType)['SSE']] {
    return this.type === WorkspaceModuleType.SSE;
  }

  /**
   * Get the location of this module.
   */
  public getLocation(): string {
    return this.workspace.resolvePath(this.type);
  }

  public async loadEntity(id: string): Promise<YasumuEntityDataMap[T]> {
    const location = await this.findEntityPath(id);
    if (!location) {
      const metadata = this.workspace.getMetadata();
      delete this.getRootIndex().entities[id];
      await metadata.save();
      throw new EntityNotFoundError(id, this.type);
    }

    const entity = await this.workspace.yasumu.fs.readTextFile(location);

    return this.schema.parse(entity) as any;
  }

  public async findEntityPath(id: string) {
    const rootIndex = this.findEntity(id);
    if (!rootIndex) return null;

    const location = this.getLocation();
    const targetPath = this.workspace.yasumu.utils.joinPathSync(
      location,
      rootIndex.path,
    );
    const target = await this.workspace.indexer.findIndex(targetPath, id);

    return target;
  }

  public getRootIndex() {
    const metadata = this.workspace.getMetadata().getRawData();
    const data = metadata.blocks[this.type];

    if (!data) throw new IndexNotFoundError(this.type);

    return data;
  }

  public findEntity(id: string) {
    return this.getRootIndex().entities[id] ?? null;
  }

  public async getRawEntities(
    index?: RootIndex<unknown>,
  ): Promise<YasumuEntityDataMap[T][]> {
    const rootIndex = index ?? this.getRootIndex();
    const entities = await Promise.all(
      Object.keys(rootIndex.entities).map((id) => {
        return this.loadEntity(id);
      }),
    );

    return entities;
  }

  public async getEntities(): Promise<YasumuEntityMap[T][]> {
    const entities = await this.getRawEntities();

    // @ts-expect-error this should be resolved
    return entities.map((entity) => {
      // @ts-expect-error this should be resolved
      return new YasumuEntityMap[this.type](this, entity);
    });
  }

  public async toStandalone(): Promise<YasumuStandaloneFormat['entities'][T]> {
    const index = this.getRootIndex();
    const entities = await this.getRawEntities(index);

    const indexes = await Promise.all(
      Object.values(index.entities)
        .filter(
          (e) =>
            e &&
            typeof e === 'object' &&
            'path' in e &&
            e.path &&
            typeof e.path === 'string',
        )
        .map(async (e) => {
          const path = e.path;
          const targetLocation = this.workspace.yasumu.utils.joinPathSync(
            this.getLocation(),
            path,
          );
          return {
            [path]: await this.workspace.indexer.getIndexFile(targetLocation),
          };
        }),
    );

    return {
      indexes: indexes.reduce((acc, curr) => ({ ...acc, ...curr }), {}),
      entities: entities.reduce(
        (acc, curr) => ({ ...acc, [curr.blocks.Metadata.id]: curr }),
        {},
      ),
    };
  }

  /**
   * Import a standalone format into this module.
   * @param data The data to import.
   * @param options The options for importing.
   */
  public async fromStandalone(
    data: YasumuStandaloneFormat['entities'][T],
    options: { overwrite?: boolean },
  ) {
    const { entities, indexes } = data ?? {};

    if (!entities || !indexes) return;

    const fs = this.workspace.yasumu.fs;

    await this.ensureLocation();

    for (const entity of Object.values(entities)) {
      const location = this.workspace.yasumu.utils.joinPathSync(
        this.getLocation(),
        entity.blocks.Metadata.path,
      );
      const pathExists = await fs.exists(location);

      const entityPath = this.workspace.yasumu.utils.joinPathSync(
        location,
        `${entity.blocks.Metadata.name}--${entity.blocks.Metadata.createdAt}.ysl`,
      );

      if (!pathExists) {
        await fs.mkdir(location, { recursive: true });
      }

      if (!options.overwrite) {
        const exists = await fs.exists(entityPath);

        if (exists) {
          continue;
        }
      }

      await fs.writeTextFile(entityPath, this.schema.serialize(entity));
    }

    for (const [path, index] of Object.entries(indexes)) {
      const location = this.workspace.yasumu.utils.joinPathSync(
        this.getLocation(),
        path,
      );
      await this.workspace.indexer.saveIndex(location, index);
    }
  }

  /**
   * Ensure the location for this module exists.
   */
  public async ensureLocation() {
    const location = this.getLocation();
    const fs = this.workspace.yasumu.fs;

    const exists = await fs.exists(location);

    if (!exists) {
      await fs.mkdir(location, { recursive: true });
    }
  }

  /**
   * Called by the entity when it changes.
   * @param entity The entity that changed.
   */
  public notifyChange(entity: YasumuEntityMap[T] | BaseEntity) {
    this.workspace.events.emit(YasumuWorkspaceEvents.RebuildTree, this.type);
  }

  /**
   * Called by the entity when it is deleted.
   * @param entity The entity that was deleted.
   */
  public notifyDeleted(entity: YasumuEntityMap[T] | BaseEntity) {
    this.workspace.events.emit(YasumuWorkspaceEvents.RebuildTree, this.type);
  }

  /**
   * Generate a file tree object for this module.
   */
  public async generateTree(): Promise<YasumuEntityTree<T>> {
    const { entities } = this.getRootIndex();

    const tree: YasumuEntityTree<T> = {
      children: [],
      id: '__YASUMU_ROOT__',
      name: '__YASUMU_ROOT__',
      __type: this.type,
    };

    let i = 0;

    for (const entity of Object.values(entities)) {
      if (entity.path === '/') {
        tree.children?.push({
          ...entity,
          __type: this.type,
        });
        continue;
      }

      const parts = entity.path.split('/');

      let current: YasumuEntityTree<T>[] = tree.children!;

      for (const part of parts) {
        const child = tree.children?.find((c) => c.name === part);

        if (!child) {
          const newChild: YasumuEntityTree<T> = {
            children: [],
            name: part,
            id: `dir::${i++}`,
            __type: this.type,
          };

          current?.push(newChild);
          current = newChild.children!;
        } else {
          current = child.children!;
        }
      }

      current.push({
        ...entity,
        __type: this.type,
      });
    }

    const deepSort = (children: YasumuEntityTree<T>[]) => {
      children.sort((a, b) => {
        if (a.children && !b.children) return -1;
        if (!a.children && b.children) return 1;

        return (a.name ?? '').localeCompare(b.name ?? '');
      });

      for (const child of children) {
        if (child.children) {
          deepSort(child.children);
        }
      }
    };

    deepSort(tree.children!);

    return tree;
  }
}
