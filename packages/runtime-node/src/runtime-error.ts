import type { JsonValue, SerializedExecutionError } from '@yasumu/runtime-api';

export class NodeRuntimeError extends Error {
  readonly code: string;
  readonly details?: JsonValue;

  constructor(error: SerializedExecutionError) {
    super(error.message);
    this.name = error.name || 'NodeRuntimeError';
    this.code = error.code;
    this.details = error.details;
    if (error.cause) Object.defineProperty(this, 'cause', { value: new NodeRuntimeError(error.cause) });
    if (error.stack) this.stack = error.stack;
  }
}
