import type { InteractiveWebResponse } from '@/network/InteractiveWebResponse.js';
import { WorkspaceModuleType } from './constants.js';
import type { InteractiveWebRequest } from '@/network/InteractiveWebRequest.js';
import type { RestEntitySchemaType } from '@/schema/RestEntitySchema.js';
import type { GraphqlEntitySchemaType } from '@/schema/GraphqlEntitySchema.js';
import type { SmtpEntitySchemaType } from '@/schema/SmtpEntitySchema.js';
import type { SseEntitySchemaType } from '@/schema/SseEntitySchema.js';
import type { SocketioEntitySchemaType } from '@/schema/SocketioEntitySchema.js';
import type { WebsocketEntitySchemaType } from '@/schema/WebsocketEntitySchema.js';
import type { RestIndex } from '../rest/types.js';
import type { GraphqlIndex } from '../graphql/types.js';
import type { SseIndex } from '../sse/types.js';
import type { WebsocketIndex } from '../websocket/types.js';
import type { SmtpIndex } from '../smtp/types.js';
import type { SocketioIndex } from '../socketio/types.js';
import type { YasumuRest } from '../rest/YasumuRest.js';
import type { YasumuGraphql } from '../graphql/YasumuGraphql.js';
import type { YasumuSSE } from '../sse/YasumuSSE.js';
import type { YasumuWebSocket } from '../websocket/YasumuWebSocket.js';
import type { YasumuSmtp } from '../smtp/YasumuSmtp.js';
import type { YasumuSocketIO } from '../socketio/YasumuSocketIO.js';

export interface YasumuEntityDataMap {
  [WorkspaceModuleType.Rest]: RestEntitySchemaType;
  [WorkspaceModuleType.GraphQL]: GraphqlEntitySchemaType;
  [WorkspaceModuleType.SMTP]: SmtpEntitySchemaType;
  [WorkspaceModuleType.SSE]: SseEntitySchemaType;
  [WorkspaceModuleType.SocketIO]: SocketioEntitySchemaType;
  [WorkspaceModuleType.Websocket]: WebsocketEntitySchemaType;
}

export type YasumuEntityScript = string;

// export interface YasumuEntityScript {
//   /**
//    * The script file name.
//    */
//   name: string;
//   /**
//    * The script content.
//    */
//   content: string;
// }

export interface CommonEntityMetadata {
  /**
   * The entity id
   */
  id: string;
  /**
   * The entity name
   */
  name: string;
  /**
   * The entity path
   */
  path: string;
}

export interface ExecutionOptions {
  preScript?: boolean;
  postScript?: boolean;
  testScript?: boolean;
  request?: InteractiveWebRequest;
}

export const LogLevel = {
  Log: 'log',
  Warning: 'warning',
  Error: 'error',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export const ScriptType = {
  PreScript: 'pre-script',
  PostScript: 'post-script',
  TestScript: 'test-script',
} as const;

export type ScriptType = (typeof ScriptType)[keyof typeof ScriptType];

export interface ScriptOutput {
  log: string;
  level: LogLevel;
}

export interface ScriptResult {
  type: ScriptType;
  output: ScriptOutput[];
}

export const TestStatus = {
  Passed: 'passed',
  Failed: 'failed',
  Skipped: 'skipped',
} as const;

export type TestStatus = (typeof TestStatus)[keyof typeof TestStatus];

export interface TestSuite {
  id: string;
  name: string;
}

export interface TestEntry {
  suite: TestSuite | null;
  id: string;
  name: string;
  status: TestStatus;
  log: string;
  time: number;
}

export interface TestResult {
  tests: TestEntry[];
}

export interface ExecutionResult {
  preScript: ScriptResult;
  postScript: ScriptResult;
  test: TestResult;
  response: InteractiveWebResponse | null;
}

export interface YasumuRootEntityIndexMap {
  [WorkspaceModuleType.Rest]: RestIndex;
  [WorkspaceModuleType.GraphQL]: GraphqlIndex;
  [WorkspaceModuleType.SMTP]: SmtpIndex;
  [WorkspaceModuleType.SSE]: SseIndex;
  [WorkspaceModuleType.SocketIO]: SocketioIndex;
  [WorkspaceModuleType.Websocket]: WebsocketIndex;
}

export interface YasumuEntityTree<T extends WorkspaceModuleType> {
  id: string;
  name: string;
  entity?: YasumuRootEntityIndexMap[T];
  children?: YasumuEntityTree<T>[];
  __type: T;
}

export interface YasumuModuleTypeMap {
  [WorkspaceModuleType.Rest]: YasumuRest;
  [WorkspaceModuleType.GraphQL]: YasumuGraphql;
  [WorkspaceModuleType.SMTP]: YasumuSmtp;
  [WorkspaceModuleType.SSE]: YasumuSSE;
  [WorkspaceModuleType.SocketIO]: YasumuSocketIO;
  [WorkspaceModuleType.Websocket]: YasumuWebSocket;
}

export const isEntityTree = (
  entity: unknown,
): entity is YasumuEntityTree<WorkspaceModuleType> => {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'id' in entity &&
    'name' in entity &&
    '__type' in entity
  );
};

export const isRestEntityTree = (
  entity: unknown,
): entity is YasumuEntityTree<(typeof WorkspaceModuleType)['Rest']> => {
  return isEntityTree(entity) && entity.__type === WorkspaceModuleType.Rest;
};

export const isGraphqlEntityTree = (
  entity: unknown,
): entity is YasumuEntityTree<(typeof WorkspaceModuleType)['GraphQL']> => {
  return isEntityTree(entity) && entity.__type === WorkspaceModuleType.GraphQL;
};

export const isSmtpEntityTree = (
  entity: unknown,
): entity is YasumuEntityTree<(typeof WorkspaceModuleType)['SMTP']> => {
  return isEntityTree(entity) && entity.__type === WorkspaceModuleType.SMTP;
};

export const isSseEntityTree = (
  entity: unknown,
): entity is YasumuEntityTree<(typeof WorkspaceModuleType)['SSE']> => {
  return isEntityTree(entity) && entity.__type === WorkspaceModuleType.SSE;
};

export const isSocketioEntityTree = (
  entity: unknown,
): entity is YasumuEntityTree<(typeof WorkspaceModuleType)['SocketIO']> => {
  return isEntityTree(entity) && entity.__type === WorkspaceModuleType.SocketIO;
};

export const isWebsocketEntityTree = (
  entity: unknown,
): entity is YasumuEntityTree<(typeof WorkspaceModuleType)['Websocket']> => {
  return (
    isEntityTree(entity) && entity.__type === WorkspaceModuleType.Websocket
  );
};
