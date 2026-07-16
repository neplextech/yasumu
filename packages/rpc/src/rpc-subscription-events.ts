import type { ExecutionEvent } from '@yasumu/headless';

export interface RpcSubscriptionEvents {
  /** A structured event from the canonical headless execution lifecycle. */
  'execution-event': ExecutionEvent;
  /**
   * The event for when a rest entity is updated.
   */
  'rest-entity-updated': {
    /**
     * The ID of the workspace that the rest entity belongs to.
     */
    workspaceId: string;
  };
  /**
   * The event for when a graphql entity is updated.
   */
  'graphql-entity-updated': {
    /**
     * The ID of the workspace that the graphql entity belongs to.
     */
    workspaceId: string;
  };
  /**
   * The event for when entity history is updated.
   */
  'entity-history-updated': {
    /**
     * The ID of the workspace that the history belongs to.
     */
    workspaceId: string;
  };
}
