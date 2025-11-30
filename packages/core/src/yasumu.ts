import { WorkspaceManager } from './core/manager/workspace-manager.js';
import {
  createYasumuRPC,
  type PlatformBridge,
  type YasumuRPC,
  type YasumuRpcContext,
} from '@yasumu/rpc';
import type { YasumuEventHandlerInterface } from './events/common.js';
import { YasumuEventBus } from './events/event-bus.js';

/**
 * The options for a Yasumu instance.
 */
export interface YasumuOptions {
  /**
   * The platform bridge to use with this Yasumu instance.
   */
  platformBridge: Pick<PlatformBridge, 'invoke'>;
  /**
   * The event handler interface to use with this Yasumu instance.
   */
  events?: Partial<YasumuEventHandlerInterface>;
}

/**
 * The Yasumu class.
 */
export class Yasumu {
  public readonly events = new YasumuEventBus<YasumuEventHandlerInterface>();

  /**
   * The workspaces manager for this Yasumu instance.
   */
  public readonly workspaces = new WorkspaceManager(this);

  /**
   * Creates a new Yasumu instance.
   * @param options - The options for the Yasumu instance.
   */
  public constructor(private readonly options: YasumuOptions) {
    if (options.events) {
      this.events.onAnyEvent = (event, ...args) => {
        return void (options.events?.[event] as any)?.(...args);
      };
    }
  }

  /**
   * Initializes the Yasumu instance state.
   */
  public async initialize(): Promise<void> {
    await this.workspaces.fetchActiveWorkspace();
  }

  /**
   * Gets the context for the RPC proxy.
   * @returns The context for the RPC proxy.
   */
  public getRpcContext(): YasumuRpcContext {
    return {
      workspaceId: this.workspaces.getActiveWorkspace()?.id ?? null,
    };
  }

  /**
   * The RPC proxy for this Yasumu instance.
   */
  public get rpc(): YasumuRPC {
    return createYasumuRPC(this.options.platformBridge, this.getRpcContext());
  }
}
