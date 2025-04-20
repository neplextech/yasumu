import { YasumuFileNamesMap } from '@/common/constants.js';
import { WorkspaceNotFoundError } from '@/common/errors/WorkspaceNotFoundError.js';
import type { Yasumu } from '@/Yasumu.js';
import {
  createWorkspaceMetadata,
  YasumuWorkspaceMetadata,
} from './YasumuWorkspaceMetadata.js';
import { WorkspaceNotLoadedError } from '@/common/index.js';
import {
  YasumuGraphql,
  type YasumuModuleTypeMap,
  YasumuRest,
  YasumuSmtp,
  YasumuSocketIO,
  YasumuSSE,
  YasumuWebSocket,
} from './modules/index.js';
import type { BaseScriptRuntime } from './runtime/BaseScriptRuntime.js';
import { YasumuIndexerService } from './indexer/YasumuIndexerService.js';
import { WorkspaceModuleType } from './modules/common/constants.js';
import { WebRequestService } from './network/WebRequestService.js';
import { ExternalCollectionsUtility } from './externals/ExternalCollectionsUtility.js';
import { YasumuEnvironmentManager } from './environments/YasumuEnvironmentManager.js';
import { createYasumuEventBus } from './events/YasumuEventBus.js';
import { YasumuWorkspaceEvents } from './events/common.js';

export interface YasumuWorkspaceOptions {
  /**
   * The path to this workspace.
   */
  path: string;
  /**
   * Whether to create the workspace if it does not exist. Defaults to `true`.
   * If set to `false` and the workspace does not exist, an error will be thrown.
   */
  create?: boolean;
}

export class YasumuWorkspace {
  /**
   * The path to the workspace.
   */
  #path!: string;

  /**
   * The path to the workspace metadata.
   */
  #metadataPath!: string;

  /**
   * The metadata for this workspace.
   */
  #metadata!: YasumuWorkspaceMetadata;

  /**
   * The rest module for this workspace.
   */
  public readonly rest = new YasumuRest(this);

  /**
   * The graphql module for this workspace.
   */
  public readonly graphql = new YasumuGraphql(this);

  /**
   * The smtp module for this workspace.
   */
  public readonly smtp = new YasumuSmtp(this);

  /**
   * The sse module for this workspace.
   */
  public readonly sse = new YasumuSSE(this);

  /**
   * The websocket module for this workspace.
   */
  public readonly websocket = new YasumuWebSocket(this);

  /**
   * The socket.io module for this workspace.
   */
  public readonly socketio = new YasumuSocketIO(this);

  /**
   * The indexer service for this workspace.
   */
  public readonly indexer = new YasumuIndexerService(this);

  /**
   * The interactive web request service for this workspace.
   */
  public readonly webRequest = new WebRequestService(this);

  /**
   * External collections utility for this workspace.
   */
  public readonly externals = new ExternalCollectionsUtility(this);

  /**
   * The environment manager for this workspace.
   */
  public readonly environments = new YasumuEnvironmentManager(this);

  /**
   * The event bus for this workspace.
   */
  public readonly events = createYasumuEventBus();

  /**
   * The script runtime for this workspace.
   */
  #runtime: BaseScriptRuntime | null = null;

  /**
   * Creates a new Yasumu workspace.
   * @param yasumu The main Yasumu instance.
   * @param options The options to create the workspace with.
   */
  public constructor(
    public readonly yasumu: Yasumu,
    private readonly options: YasumuWorkspaceOptions,
  ) {}

  /**
   * The script runtime environment for this workspace.
   */
  public get runtime() {
    return this.#runtime;
  }

  /**
   * Sets the script runtime environment for this workspace.
   * @param runtime The script runtime to set.
   */
  public setScriptRuntime(runtime: BaseScriptRuntime) {
    this.#runtime = runtime;
  }

  /**
   * Whether this workspace metadata has been loaded.
   */
  public isMetadataLoaded() {
    return !!this.#metadata;
  }

  /**
   * The name of this workspace.
   */
  public get name() {
    return this.#metadata?.name ?? '';
  }

  /**
   * The metadata for this workspace.
   */
  public getMetadata(): YasumuWorkspaceMetadata;
  public getMetadata(strict?: boolean): YasumuWorkspaceMetadata;
  public getMetadata(strict: true): YasumuWorkspaceMetadata;
  public getMetadata(strict: false): YasumuWorkspaceMetadata | undefined;
  public getMetadata(strict = true): YasumuWorkspaceMetadata | undefined {
    const metadata = this.#metadata;

    if (!metadata && strict) throw new WorkspaceNotLoadedError();

    return metadata;
  }

  /**
   * The path to the workspace metadata.
   */
  public get metadataPath(): string {
    return this.#metadataPath;
  }

  /**
   * The path to the workspace.
   */
  public get path(): string {
    return this.#path;
  }

  /**
   * Loads this workspace's metadata.
   */
  public async loadMetadata(): Promise<YasumuWorkspaceMetadata> {
    const { path, create = true } = this.options;

    const workspaceDirExists = await this.yasumu.fs.exists(path);

    if (!workspaceDirExists && !create) {
      throw new WorkspaceNotFoundError(path);
    }

    if (!workspaceDirExists) {
      await this.yasumu.fs.mkdir(path, { recursive: true });
    }

    this.#metadataPath = await this.yasumu.path.join(
      path,
      YasumuFileNamesMap.WorkspaceMetadata,
    );

    const exists = await this.yasumu.fs.exists(this.#metadataPath);

    if (!exists && !create) {
      throw new WorkspaceNotFoundError(path);
    }

    this.#path = path;

    if (exists) {
      const metadata = await this.yasumu.fs.readTextFile(this.#metadataPath);
      this.#metadata = await createWorkspaceMetadata(
        this,
        YasumuWorkspaceMetadata.deserialize(metadata),
        false,
      );
    } else {
      this.#metadata = await createWorkspaceMetadata(this, {}, true);
    }

    try {
      await this.environments.loadEnvironments();
    } catch {
      //
    }

    this.events.emit(YasumuWorkspaceEvents.WorkspaceCreated, this);

    return this.#metadata;
  }

  /**
   * Resolves a module path relative to this workspace.
   * @param type The type of module to resolve.
   */
  public resolvePath(type: WorkspaceModuleType) {
    const workspacePath = this.path;

    switch (type) {
      case WorkspaceModuleType.Rest:
        return this.yasumu.utils.joinPathSync(workspacePath, 'rest');
      case WorkspaceModuleType.GraphQL:
        return this.yasumu.utils.joinPathSync(workspacePath, 'graphql');
      case WorkspaceModuleType.SMTP:
        return this.yasumu.utils.joinPathSync(workspacePath, 'smtp');
      case WorkspaceModuleType.Websocket:
        return this.yasumu.utils.joinPathSync(workspacePath, 'websocket');
      case WorkspaceModuleType.SocketIO:
        return this.yasumu.utils.joinPathSync(workspacePath, 'socketio');
      case WorkspaceModuleType.SSE:
        return this.yasumu.utils.joinPathSync(workspacePath, 'sse');
      default:
        throw new TypeError(`Unknown module type: ${type}`);
    }
  }

  /**
   * Resolves a workspace module by its type
   * @param type The type of module to resolve.
   */
  public resolveModule<T extends WorkspaceModuleType>(
    type: T,
  ): YasumuModuleTypeMap[T] {
    // TODO: remove 'as any' in typescript 5.8
    switch (type) {
      case WorkspaceModuleType.Rest:
        return this.rest as any;
      case WorkspaceModuleType.GraphQL:
        return this.graphql as any;
      case WorkspaceModuleType.SMTP:
        return this.smtp as any;
      case WorkspaceModuleType.Websocket:
        return this.websocket as any;
      case WorkspaceModuleType.SocketIO:
        return this.socketio as any;
      case WorkspaceModuleType.SSE:
        return this.sse as any;
      default:
        throw new TypeError(`Unknown module type: ${type}`);
    }
  }
}
