export interface OnRequestLifecycle {
  /**
   * Called before the request is sent.
   */
  onPreRequest(): Promise<void>;
  /**
   * Called after the response is received.
   */
  onPostResponse(): Promise<void>;
}
