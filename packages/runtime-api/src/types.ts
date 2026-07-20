export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ScriptEntityKind = 'rest' | 'graphql' | 'sse' | 'script' | 'email';

export interface ScriptSource {
  id: string;
  code: string;
  sourceUrl?: string;
}

export interface ScriptEntity {
  id: string;
  name: string;
  kind: ScriptEntityKind;
  groupId?: string | null;
  metadata?: Readonly<Record<string, JsonValue>>;
}

export interface ScriptWorkspaceDescriptor {
  id: string;
  name: string;
  root?: string;
}

export interface ScriptExecutionInfo {
  id: string;
  parentId?: string;
  rootId: string;
  depth: number;
  mode: 'run' | 'test';
  startedAt: number;
}

export interface EnvironmentSnapshot {
  id?: string;
  name?: string;
  variables: Record<string, JsonValue>;
  secrets: Record<string, string>;
}

export interface RuntimeLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  data?: JsonValue[];
}

export interface TestResult {
  id?: string;
  suite?: string[];
  test: string;
  result: 'pass' | 'fail' | 'skip';
  error: string | null;
  duration: number;
}

export interface SourcePosition {
  line: number;
  column: number;
  offset?: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface Diagnostic {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  file?: string;
  range?: SourceRange;
  entityId?: string;
  executionId?: string;
  details?: JsonValue;
}

export interface SerializedExecutionError {
  name: string;
  code: string;
  message: string;
  stack?: string;
  cause?: SerializedExecutionError;
  details?: JsonValue;
}

export type SerializedBody =
  | { kind: 'empty'; size: 0; truncated: false }
  | { kind: 'text'; text: string; size: number; truncated: boolean; contentType?: string }
  | { kind: 'json'; value: JsonValue; size: number; truncated: boolean; contentType?: string }
  | { kind: 'binary'; bytes?: number[]; size: number; truncated: boolean; contentType?: string };

export interface RequestSnapshot {
  url: string;
  method: string;
  headers: Array<[string, string]>;
  body: SerializedBody;
}

export interface ResponseSnapshot {
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
  body: SerializedBody;
}

export interface SseEvent {
  id?: string;
  event: string;
  data: string;
  retry?: number;
  receivedAt: number;
}

export interface WorkspaceEmail {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  html: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  unread?: boolean;
  metadata?: Record<string, JsonValue>;
}

export interface YasumuFileReference {
  id: string;
  name: string;
  mimeType?: string;
  size?: number;
  source:
    | { type: 'workspace-path'; path: string }
    | { type: 'host-handle'; handleId: string }
    | { type: 'inline'; bytes: number[] };
}

export interface ResolvedScriptFile extends YasumuFileReference {
  resolvedPath?: string;
}

export interface PermissionRequest {
  capability: RuntimeCapabilityName;
  resource?: string;
  reason?: string;
  executionId: string;
}

export interface RuntimeCapabilities {
  workers: boolean;
  nodeBuiltins: boolean;
  filesystemRead: boolean;
  filesystemWrite: boolean;
  network: boolean;
  environment: boolean;
  subprocess: boolean;
  ffi: boolean;
  nativeModules: boolean;
  virtualModules: boolean;
  workspaceFiles: boolean;
  email: boolean;
  nestedExecution: boolean;
}

export type RuntimeCapabilityName = keyof RuntimeCapabilities;

export interface NestedExecutionOptions {
  environmentId?: string;
  variables?: Record<string, JsonValue>;
  secrets?: Record<string, string>;
  withResponse?: boolean;
  runTests?: boolean;
  timeoutMs?: number;
  maxEvents?: number;
}

export interface NestedExecutionSummary {
  executionId: string;
  entityId: string;
  status: 'completed' | 'cancelled' | 'failed';
  response?: ResponseSnapshot;
  tests: TestResult[];
  logs: RuntimeLog[];
  diagnostics: Diagnostic[];
  error?: SerializedExecutionError;
}

export interface RuntimeHostCalls {
  'entity.get': { input: { kind: 'rest' | 'graphql' | 'sse'; id: string }; output: ScriptEntity | null };
  'entity.list': { input: { kind: 'rest' | 'graphql' | 'sse' }; output: ScriptEntity[] };
  'entity.execute': {
    input: { kind: 'rest' | 'graphql' | 'sse'; id: string; options?: NestedExecutionOptions };
    output: NestedExecutionSummary;
  };
  'email.list': {
    input: { since: number; limit?: number };
    output: { emails: WorkspaceEmail[]; cursor?: string };
  };
  'email.next': {
    input: { since: number; cursor?: string; timeoutMs?: number };
    output: { email: WorkspaceEmail | null; cursor?: string };
  };
  'file.resolve': { input: { path: string }; output: ResolvedScriptFile };
  'file.open': { input: { reference: YasumuFileReference }; output: { file: ResolvedScriptFile; bytes: number[] } };
  'permission.request': { input: PermissionRequest; output: { granted: boolean } };
}

export type RuntimeHostMethod = keyof RuntimeHostCalls;

export type RuntimeHostCall = {
  [K in RuntimeHostMethod]: { id: string; method: K; input: RuntimeHostCalls[K]['input'] };
}[RuntimeHostMethod];

export type RuntimeHostCallResult<K extends RuntimeHostMethod = RuntimeHostMethod> = {
  id: string;
  method: K;
  output?: RuntimeHostCalls[K]['output'];
  error?: SerializedExecutionError;
};

export type RuntimeHostCallHandler = <K extends RuntimeHostMethod>(
  method: K,
  input: RuntimeHostCalls[K]['input'],
  signal: AbortSignal,
) => Promise<RuntimeHostCalls[K]['output']>;

export interface ScriptHookInvocation {
  hook: ScriptHookName;
  source: ScriptSource;
  workspace: ScriptWorkspaceDescriptor;
  entity: ScriptEntity;
  execution: ScriptExecutionInfo;
  environment: EnvironmentSnapshot;
  request?: RequestSnapshot;
  response?: ResponseSnapshot;
  isMockResponse?: boolean;
  email?: WorkspaceEmail;
}

export interface ScriptHookResult {
  request?: RequestSnapshot;
  mockResponse?: ResponseSnapshot;
  environment: EnvironmentSnapshot;
  tests: TestResult[];
  logs: RuntimeLog[];
  diagnostics: Diagnostic[];
  cancelled?: boolean;
  cancelReason?: string;
}

export interface CreateRuntimeSessionInput {
  workspace: ScriptWorkspaceDescriptor;
  workspaceModule?: ScriptSource;
  hostCall: RuntimeHostCallHandler;
}

export interface InvokeHookOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface YasumuRuntimeSession {
  invokeHook(invocation: ScriptHookInvocation, options?: InvokeHookOptions): Promise<ScriptHookResult>;
  dispose(): Promise<void>;
}

export interface YasumuScriptRuntime {
  readonly kind: string;
  readonly capabilities: Readonly<RuntimeCapabilities>;
  createSession(input: CreateRuntimeSessionInput): Promise<YasumuRuntimeSession>;
}

export interface EnvironmentScriptAPI {
  readonly id?: string;
  readonly name?: string;
  getVariable(name: string): JsonValue | undefined;
  getSecret(name: string): string | undefined;
  getAllVariables(): Readonly<Record<string, JsonValue>>;
  getAllSecrets(): Readonly<Record<string, string>>;
  setVariable(name: string, value: JsonValue): void;
  setSecret(name: string, value: string): void;
  hasVariable(name: string): boolean;
  hasSecret(name: string): boolean;
}

export interface RestExecutionAPI {
  get(id: string): Promise<ScriptEntity | null>;
  list(): Promise<ScriptEntity[]>;
  execute(id: string, options?: NestedExecutionOptions): Promise<NestedExecutionSummary>;
}

export interface GraphQLExecutionAPI extends RestExecutionAPI {}

export interface SseExecutionAPI extends RestExecutionAPI {}

export interface AwaitEmailOptions {
  timeoutMs?: number;
  since?: Date | number;
  signal?: AbortSignal;
}

export interface EmailQueryOptions {
  since?: Date | number;
  limit?: number;
}

export interface EmailScriptAPI {
  awaitEmail(
    predicate: (email: WorkspaceEmail) => boolean | Promise<boolean>,
    options?: AwaitEmailOptions,
  ): Promise<WorkspaceEmail>;
  list(options?: EmailQueryOptions): Promise<WorkspaceEmail[]>;
}

export interface ScriptFileAPI {
  resolve(path: string): Promise<ResolvedScriptFile>;
  open(pathOrReference: string | YasumuFileReference): Promise<File>;
}

export interface ScriptWorkspace {
  readonly id: string;
  readonly name: string;
  readonly root?: string;
  readonly rest: RestExecutionAPI;
  readonly graphql: GraphQLExecutionAPI;
  readonly sse: SseExecutionAPI;
  readonly email: EmailScriptAPI;
  readonly env: EnvironmentScriptAPI;
  readonly files: ScriptFileAPI;
}

export interface BaseScriptContext<TEntity extends ScriptEntity = ScriptEntity> {
  readonly id: string;
  readonly entity: TEntity;
  readonly workspace: ScriptWorkspace;
  readonly execution: ScriptExecutionInfo;
  readonly signal: AbortSignal;
  cancel(reason?: string): void;
}

export interface RequestHookContext<TEntity extends ScriptEntity = ScriptEntity> extends BaseScriptContext<TEntity> {
  req: Request;
  setRequest(request: Request): void;
}

export interface ResponseHookContext<TEntity extends ScriptEntity = ScriptEntity> extends BaseScriptContext<TEntity> {
  readonly req: Request;
  readonly res: Response;
  readonly isMockResponse: boolean;
}

export interface TestHookContext<TEntity extends ScriptEntity = ScriptEntity> extends ResponseHookContext<TEntity> {
  readonly isTest: true;
}

export interface EmailHookContext<TEntity extends ScriptEntity = ScriptEntity> extends BaseScriptContext<TEntity> {
  readonly email: WorkspaceEmail;
}

export interface TestContext {
  skip(): never;
  fail(message?: string): never;
  succeed(): never;
}

export type ScriptTestFunction = (context: TestContext) => void | Promise<void>;

export interface RuntimeDescriptor {
  readonly kind: string;
  readonly apiVersion: number;
  readonly capabilities: Readonly<RuntimeCapabilities>;
}

import type { ScriptHookName } from './generated.js';
