import type { CommonScriptRuntimeContext } from '../common/common.types.js';
import type { HttpMethod } from './rest.constants.js';

export interface RestRequestContextData {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body: unknown;
  parameters: Record<string, string>;
}

export interface RestResponseContextData {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface RestScriptContext extends CommonScriptRuntimeContext {
  request: RestRequestContextData;
  response: RestResponseContextData | null;
}
