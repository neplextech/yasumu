import {
  YasumuWorkspace,
  type YasumuWorkspaceOptions,
} from '@/YasumuWorkspace.js';
import type {
  ApplicationCommon,
  CommandCommon,
  DialogCommon,
  EventsCommon,
  FileSystemCommon,
  PathCommon,
  ProcessCommon,
  ShellCommon,
  StoreCommon,
  AdapterCommonMap,
  FetchCommon,
  WithCreateStore,
  StoreType,
  WebSocketCommon,
} from '@yasumu/common';
import { AdapterType } from '@yasumu/common';
import { YASUMU_API_VERSION } from './common/constants.js';
import { YasumuUtilities } from './YasumuUtilities.js';

export type YasumuCommon = {
  [K in AdapterType]: AdapterCommonMap[K];
};

/**
 * The options to bootstrap the yasumu application with.
 */
export interface YasumuBootstrapOptions {
  /**
   * The adapters to use for the application.
   */
  adapters: WithCreateStore<AdapterCommonMap>;
}

/**
 * Represents the main Yasumu application.
 */
export class Yasumu implements YasumuCommon {
  /**
   * The application adapter to use.
   */
  public readonly app: ApplicationCommon;
  /**
   * The file system adapter to use.
   */
  public readonly fs: FileSystemCommon;
  /**
   * The command adapter to use.
   */
  public readonly command: CommandCommon;
  /**
   * The dialog adapter to use.
   */
  public readonly dialog: DialogCommon;
  /**
   * The events adapter to use.
   */
  public readonly events: EventsCommon;
  /**
   * The path adapter to use.
   */
  public readonly path: PathCommon;
  /**
   * The process adapter to use.
   */
  public readonly process: ProcessCommon;
  /**
   * The shell adapter to use.
   */
  public readonly shell: ShellCommon;
  /**
   * The kv store adapter to use.
   */
  public store!: StoreCommon;
  /**
   * The fetch adapter to use.
   */
  public readonly fetch: FetchCommon;
  /**
   * The store creator function.
   */
  public readonly createStore: StoreType;
  /**
   * The websocket adapter to use.
   */
  public readonly websocket!: WebSocketCommon;

  /**
   * The current workspace. This is set when a workspace is opened. If no workspace is open, this returns `null`.
   */
  #workspace: YasumuWorkspace | null = null;

  /**
   * The common utilities for the workspace modules.
   */
  public readonly utils: YasumuUtilities;

  /**
   * Create a new Yasumu instance. This is the main entry point for the application.
   * @param options The options to bootstrap the application with.
   */
  public constructor(options: YasumuBootstrapOptions) {
    this.app = options.adapters[AdapterType.Application];
    this.fs = options.adapters[AdapterType.FileSystem];
    this.command = options.adapters[AdapterType.Command];
    this.dialog = options.adapters[AdapterType.Dialog];
    this.events = options.adapters[AdapterType.Events];
    this.path = options.adapters[AdapterType.Path];
    this.process = options.adapters[AdapterType.Process];
    this.shell = options.adapters[AdapterType.Shell];
    this.createStore = options.adapters.createStore;
    this.fetch = options.adapters[AdapterType.Fetch];
    this.websocket = options.adapters[AdapterType.WebSocket];
    this.utils = new YasumuUtilities(this);

    options.adapters.createStore('yasumu').then((store) => {
      this.store = store;
    }, console.error);
  }

  /**
   * Represents the currently active workspace. If no workspace is open, this returns `null`.
   */
  public get workspace() {
    return this.#workspace;
  }

  /**
   * Open a workspace at the given path. This replaces the current workspace.
   * @param options The options to open the workspace with.
   * @returns The workspace instance.
   */
  public async openWorkspace(options: YasumuWorkspaceOptions) {
    const workspace = new YasumuWorkspace(this, options);

    await workspace.loadMetadata();

    this.#workspace = workspace;

    return workspace;
  }

  /**
   * The api version of Yasumu.
   */
  public get apiVersion() {
    return YASUMU_API_VERSION;
  }
}
