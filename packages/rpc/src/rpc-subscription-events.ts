export interface RpcSubscriptionEvents {
  /**
   * The event for when a rest entity is updated.
   */
  'rest-entity-updated': {
    /**
     * The ID of the workspace that the rest entity belongs to.
     */
    workspaceId: string;
  };
}
