export interface WorkerHeartbeatMessage {
  type: 'heartbeat';
}

export interface WorkerReadyMessage {
  type: 'ready';
}

export interface WorkerExecuteMessage<Context = unknown> {
  type: 'execute';
  requestId: string;
  moduleKey: string;
  invocationTarget: string;
  contextType: string;
  context: Context;
}

export interface WorkerExecutionSuccessMessage<Context = unknown> {
  type: 'execution-success';
  requestId: string;
  context: Context;
  result: unknown;
}

export interface WorkerExecutionErrorMessage<Context = unknown> {
  type: 'execution-error';
  requestId: string;
  context: Context;
  error: string;
}

export interface WorkerTerminateMessage {
  type: 'terminate';
}

export type WorkerInboundMessage<Context = unknown> =
  | WorkerExecuteMessage<Context>
  | WorkerTerminateMessage;

export type WorkerOutboundMessage<Context = unknown> =
  | WorkerHeartbeatMessage
  | WorkerReadyMessage
  | WorkerExecutionSuccessMessage<Context>
  | WorkerExecutionErrorMessage<Context>;

export interface ScriptExecutionRequest<Context = unknown> {
  requestId: string;
  invocationTarget: string;
  contextType: string;
  context: Context;
  resolve: (result: ScriptExecutionResponse<Context>) => void;
  reject: (error: Error) => void;
  timeoutId?: number;
}

export interface ScriptExecutionResponse<Context = unknown> {
  context: Context;
  success: boolean;
  result?: unknown;
  error?: string;
}

export type WorkerState = 'initializing' | 'ready' | 'executing' | 'terminated';
