import type {
  CommonEntity,
  CustomMetadata,
  TabularPair,
  TestResult,
  YasumuEmbeddedScript,
} from '../common/common.types.js';
import type { HttpMethod } from '../rest/rest.constants.js';
import type { RestEntityRequestBody } from '../rest/rest.types.js';

export interface SseReconnectOptions {
  enabled: boolean;
  retryMs: number;
}

export interface SseEntityMetadata {
  responseCache: { status: number; statusText: string; headers: Record<string, string>; body: string | null };
  requestCache: { binaryPaths: Record<string, string | null> };
  testResultCache: TestResult[];
}

export interface SseEntityData extends CommonEntity {
  name: string | null;
  method: HttpMethod;
  url: string | null;
  groupId: string | null;
  requestHeaders: TabularPair[];
  requestParameters: TabularPair[];
  searchParameters: TabularPair[];
  requestBody: RestEntityRequestBody | null;
  eventTypes: string[];
  reconnect: SseReconnectOptions;
  script: YasumuEmbeddedScript;
  testScript: YasumuEmbeddedScript | null;
  dependencies: string[];
}

export interface SseEntityCreateOptions extends CustomMetadata {
  name: string;
  method: HttpMethod;
  url: string | null;
  groupId?: string | null;
  requestHeaders?: TabularPair[];
  requestParameters?: TabularPair[];
  searchParameters?: TabularPair[];
  requestBody?: RestEntityRequestBody | null;
  eventTypes?: string[];
  reconnect?: SseReconnectOptions;
  script?: YasumuEmbeddedScript;
  testScript?: YasumuEmbeddedScript | null;
  dependencies?: string[];
}

export interface SseEntityUpdateOptions extends Partial<SseEntityCreateOptions> {}

export interface SseTreeFolder {
  id: string;
  name: string;
  type: 'folder';
  parentId: string | null;
  workspaceId: string;
  entityType: 'sse';
  children: SseTreeItem[];
}

export interface SseTreeFile {
  id: string;
  name: string | null;
  type: 'file';
  method: HttpMethod;
  url: string | null;
  groupId: string | null;
  workspaceId: string;
}

export type SseTreeItem = SseTreeFolder | SseTreeFile;
