import type {
  RuntimeHostCall,
  RuntimeHostCallResult,
  RuntimeLog,
  ScriptHookInvocation,
  ScriptHookResult,
  SerializedExecutionError,
} from './types.js';

export interface RuntimeReadyMessage {
  type: 'ready';
}

export interface RuntimeInvokeMessage {
  type: 'invoke';
  requestId: string;
  invocation: ScriptHookInvocation;
  timeoutMs?: number;
}

export interface RuntimeResultMessage {
  type: 'result';
  requestId: string;
  result: ScriptHookResult;
}

export interface RuntimeErrorMessage {
  type: 'error';
  requestId: string;
  error: SerializedExecutionError;
}

export interface RuntimeLogMessage {
  type: 'log';
  requestId: string;
  log: RuntimeLog;
}

export interface RuntimeHostCallMessage {
  type: 'host-call';
  requestId: string;
  call: RuntimeHostCall;
}

export interface RuntimeHostResultMessage {
  type: 'host-result';
  requestId: string;
  result: RuntimeHostCallResult;
}

export interface RuntimeCancelMessage {
  type: 'cancel';
  requestId: string;
  reason?: string;
}

export interface RuntimeDisposeMessage {
  type: 'dispose';
}

export type RuntimeInboundMessage =
  | RuntimeInvokeMessage
  | RuntimeHostResultMessage
  | RuntimeCancelMessage
  | RuntimeDisposeMessage;

export type RuntimeOutboundMessage =
  | RuntimeReadyMessage
  | RuntimeResultMessage
  | RuntimeErrorMessage
  | RuntimeLogMessage
  | RuntimeHostCallMessage;
