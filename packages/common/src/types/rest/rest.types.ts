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
  type: 'json' | 'text' | 'form-data' | 'multipart/form-data';
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
