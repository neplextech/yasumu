import type { Diagnostic, JsonValue, SerializedExecutionError, SourceRange } from '@yasumu/runtime-api';

export const YasumuErrorCodes = {
  WorkspaceNotFound: 'WORKSPACE_NOT_FOUND',
  EntityNotFound: 'ENTITY_NOT_FOUND',
  InvalidEntity: 'INVALID_ENTITY',
  InvalidYsl: 'INVALID_YSL',
  DuplicateEntityId: 'DUPLICATE_ENTITY_ID',
  InvalidReference: 'INVALID_REFERENCE',
  InterpolationError: 'INTERPOLATION_ERROR',
  MissingVariable: 'MISSING_VARIABLE',
  MissingSecret: 'MISSING_SECRET',
  FileNotFound: 'FILE_NOT_FOUND',
  FileAccessDenied: 'FILE_ACCESS_DENIED',
  ScriptLoadError: 'SCRIPT_LOAD_ERROR',
  ScriptRuntimeError: 'SCRIPT_RUNTIME_ERROR',
  HookExecutionError: 'HOOK_EXECUTION_ERROR',
  RequestFailed: 'REQUEST_FAILED',
  RequestTimeout: 'REQUEST_TIMEOUT',
  ExecutionCancelled: 'EXECUTION_CANCELLED',
  EmailTimeout: 'EMAIL_TIMEOUT',
  PermissionDenied: 'PERMISSION_DENIED',
  ReconciliationConflict: 'RECONCILIATION_CONFLICT',
  NestingDepthExceeded: 'NESTING_DEPTH_EXCEEDED',
} as const;

export type YasumuErrorCode = (typeof YasumuErrorCodes)[keyof typeof YasumuErrorCodes];

export interface YasumuErrorOptions {
  cause?: unknown;
  workspaceId?: string;
  entityId?: string;
  executionId?: string;
  file?: string;
  range?: SourceRange;
  details?: JsonValue;
}

const ErrorWithCause = Error as new (message?: string) => Error & { cause?: unknown };

export class YasumuError extends ErrorWithCause {
  override readonly cause?: unknown;
  readonly code: YasumuErrorCode;
  readonly workspaceId?: string;
  readonly entityId?: string;
  readonly executionId?: string;
  readonly file?: string;
  readonly range?: SourceRange;
  readonly details?: JsonValue;

  constructor(code: YasumuErrorCode, message: string, options: YasumuErrorOptions = {}) {
    super(message);
    this.name = 'YasumuError';
    this.cause = options.cause;
    this.code = code;
    this.workspaceId = options.workspaceId;
    this.entityId = options.entityId;
    this.executionId = options.executionId;
    this.file = options.file;
    this.range = options.range;
    this.details = options.details;
  }

  toDiagnostic(severity: Diagnostic['severity'] = 'error'): Diagnostic {
    return {
      code: this.code,
      message: this.message,
      severity,
      file: this.file,
      range: this.range,
      entityId: this.entityId,
      executionId: this.executionId,
      details: this.details,
    };
  }

  toJSON(): SerializedExecutionError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: this.stack,
      details: this.details,
      cause: this.cause ? serializeYasumuError(this.cause) : undefined,
    };
  }
}

export class WorkspaceValidationError extends YasumuError {
  readonly diagnostics: Diagnostic[];

  constructor(message: string, diagnostics: Diagnostic[]) {
    super(YasumuErrorCodes.InvalidYsl, message, { details: diagnostics as unknown as JsonValue });
    this.name = 'WorkspaceValidationError';
    this.diagnostics = diagnostics;
  }
}

export function serializeYasumuError(
  error: unknown,
  fallbackCode: YasumuErrorCode = YasumuErrorCodes.RequestFailed,
): SerializedExecutionError {
  if (error instanceof YasumuError) return error.toJSON();
  if (error instanceof Error) {
    const cause = 'cause' in error ? (error as Error & { cause?: unknown }).cause : undefined;

    return {
      name: error.name,
      code: fallbackCode,
      message: error.message,
      stack: error.stack,
      cause: cause === undefined ? undefined : serializeYasumuError(cause, fallbackCode),
    } satisfies SerializedExecutionError;
  }
  return {
    name: 'Error',
    code: fallbackCode,
    message: typeof error === 'string' ? error : String(error),
  } satisfies SerializedExecutionError;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError' || error.name === 'TimeoutError'
    : error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}
