export type MessageHandler<T = unsafe> = (message: T) => Promise<void> | void;

export class MessageQueue {
  private readonly _queue: Array<{ topic: string; message: unknown }> = [];
  private readonly _subscribers: Map<string, Set<MessageHandler>> = new Map();

  /**
   * Publish a message to a topic. All current subscribers are notified.
   * @param topic The topic to publish to
   * @param message The message object
   */
  public async publish<T = unsafe>(topic: string, message: T): Promise<void> {
    this._queue.push({ topic, message });

    // Notify all subscribers for this topic
    const handlers = this._subscribers.get(topic);

    if (handlers && handlers.size > 0) {
      // Call each subscribed handler
      for (const handler of handlers) {
        try {
          await handler(message);
        } catch (err) {
          // Prevent one handler's error from breaking others
          console.error(
            `[MessageQueue] Subscriber error on topic "${topic}":`,
            err,
          );
        }
      }
    }
  }

  /**
   * Subscribe to a topic to receive published messages.
   * @param topic The topic string
   * @param handler The message handler function
   * @returns Unsubscribe function
   */
  subscribe<T = unsafe>(topic: string, handler: MessageHandler<T>): () => void {
    if (!this._subscribers.has(topic)) {
      this._subscribers.set(topic, new Set());
    }

    this._subscribers.get(topic)!.add(handler);

    // Return unsubscribe function
    return () => {
      const set = this._subscribers.get(topic);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this._subscribers.delete(topic);
        }
      }
    };
  }

  /**
   * Get the message queue for inspection/testing.
   */
  get queue() {
    return [...this._queue];
  }

  /**
   * Clear all queued messages.
   */
  clear() {
    this._queue.length = 0;
  }

  /**
   * Remove all subscribers for all topics.
   */
  clearSubscribers() {
    this._subscribers.clear();
  }
}
