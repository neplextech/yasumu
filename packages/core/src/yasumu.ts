import { WorkspaceService } from './services/workspace.service.js';

/**
 * Represents the configuration for the Yasumu application.
 */
export interface YasumuConfig {
  /**
   * The custom fetch implementation to use. Defaults to the global fetch.
   * @default globalThis.fetch
   */
  fetch?: typeof fetch;
  /**
   * The api server url for Yasumu.
   */
  apiUrl: string;
}

/**
 * The Yasumu class is the main entrypoint for the Yasumu application.
 */
export class Yasumu {
  /**
   * The workspace service for this Yasumu instance.
   */
  public workspace = new WorkspaceService(this);

  /**
   * Creates a new Yasumu instance.
   * @param config The configuration for the Yasumu application.
   */
  public constructor(public readonly config: YasumuConfig) {}

  /**
   * Connects to the Yasumu server.
   */
  public async connect(): Promise<void> {}
}
