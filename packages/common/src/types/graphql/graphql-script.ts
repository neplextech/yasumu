import type { CommonScriptRuntimeContext } from '../common/common.types.js';

export interface GraphqlRequestContextData {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  parameters: Record<string, string>;
}

export interface GraphqlResponseContextData {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface GraphqlScriptContext extends CommonScriptRuntimeContext {
  request: GraphqlRequestContextData;
  response: GraphqlResponseContextData | null;
}
