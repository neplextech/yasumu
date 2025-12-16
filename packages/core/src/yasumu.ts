import { WorkspaceManager } from './core/manager/workspace-manager.js';
import {
  createYasumuRPC,
  type PlatformBridge,
  type YasumuRPC,
  type YasumuRpcContext,
  type RpcSubscriptionEvents,
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
  platformBridge: PlatformBridge;
  /**
   * The event handler interface to use with this Yasumu instance.
   */
  events?: Partial<YasumuEventHandlerInterface>;
}

/**
 * The interface for a subscription event.
 */
export type SubscriptionEventPayload<
  T extends RpcSubscriptionEvents = RpcSubscriptionEvents,
> = {
  /**
   * The event name.
   */
  event: keyof T;
  /**
   * The data for the event.
   */
  data: T[keyof T];
};

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
    return createYasumuRPC(this.getPlatformBridge(), this.getRpcContext());
  }

  /**
   * Gets the platform bridge for this Yasumu instance.
   * @returns The platform bridge for this Yasumu instance.
   */
  public getPlatformBridge(): PlatformBridge {
    return this.options.platformBridge;
  }

  /**
   * Handles a subscription event.
   * @param payload The event payload.
   */
  public async onSubscription(
    payload: SubscriptionEventPayload,
  ): Promise<void> {
    const event = payload.event;
    const activeWorkspace = this.workspaces.getActiveWorkspace();

    switch (event) {
      case 'rest-entity-updated':
        {
          if (activeWorkspace?.id !== payload.data.workspaceId) return;
          this.events.emit('onRestEntityUpdate', activeWorkspace);
        }
        break;
      default:
        return void (event satisfies never);
    }
  }
}
