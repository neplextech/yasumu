import type {
  CustomMetadata,
  TabularPair,
  YasumuScript,
} from '../common/common.types.js';
import type { HttpMethod } from './rest.constants.js';

/**
 * The body of the request.
 */
export interface RestEntityBody extends CustomMetadata {
  /**
   * The type of the body.
   */
  type: 'json' | 'text' | 'binary' | 'form-data' | 'x-www-form-urlencoded';
  /**
   * The data of the body.
   */
  data: unknown;
}

/**
 * The data of the request.
 */
export interface RestEntityData extends CustomMetadata {
  /**
   * The id of the request.
   */
  id: string;
  /**
   * The scripts of the request.
   */
  scripts: YasumuScript[];
  /**
   * The name of the request.
   */
  name: string | null;
  /**
   * The method of the request.
   */
  method: HttpMethod;
  /**
   * The url of the request.
   */
  url: string | null;
  /**
   * The headers of the request.
   */
  headers: TabularPair[];
  /**
   * The parameters of the request.
   */
  parameters: TabularPair[];
  /**
   * The body of the request.
   */
  body: RestEntityBody | null;
}

/**
 * The options for creating a new rest entity.
 */
export interface RestEntityCreateOptions extends CustomMetadata {
  /**
   * The name of the request.
   */
  name: string;
  /**
   * The method of the request.
   */
  method: HttpMethod;
  /**
   * The url of the request.
   */
  url: string | null;
  /**
   * The group id of the request.
   */
  groupId?: string | null;
}

/**
 * The options for updating a rest entity.
 */
export interface RestEntityUpdateOptions extends CustomMetadata {
  /**
   * The name of the request.
   */
  name?: string;
  /**
   * The method of the request.
   */
  method?: HttpMethod;
  /**
   * The url of the request.
   */
  url?: string | null;
  /**
   * The headers of the request.
   */
  headers?: TabularPair[];
  /**
   * The parameters of the request.
   */
  parameters?: TabularPair[];
  /**
   * The body of the request.
   */
  body?: RestEntityBody | null;
  /**
   * The group id of the request.
   */
  groupId?: string | null;
}

/**
 * The result of executing a rest entity.
 */
export interface RestEntityExecutionResult {
  /**
   * The stage of the execution.
   */
  stage: 'pre' | 'post';
  /**
   * The data of the execution.
   */
  data: MaybePatchableEntityExecutionData;
}

/**
 * The data of the execution result.
 */
export interface MaybePatchableEntityExecutionData {
  /**
   * The headers of the response.
   */
  headers: TabularPair[];
  /**
   * The type of the data.
   */
  type: 'json' | 'text' | 'unknown';
  /**
   * The body of the response.
   */
  body: string | null;
}
