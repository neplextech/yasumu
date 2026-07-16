import type { ExecutionEvent, ExecutionEventSink } from '@yasumu/headless';

export type GuiExecutionEventPublisher = (event: ExecutionEvent) => void | Promise<void>;

/** Publishes canonical lifecycle events through the desktop subscription bridge. */
export class GuiExecutionEventSink implements ExecutionEventSink {
  public constructor(private readonly publish: GuiExecutionEventPublisher) {}

  public emit(event: ExecutionEvent): void | Promise<void> {
    return this.publish(event);
  }
}
