import type {
  CommonEntity,
  CustomMetadata,
  TabularPair,
  YasumuEmbeddedScript,
} from '../common/common.types.js';
import type { HttpMethod } from './rest.constants.js';

/**
 * The body of the request.
 */
export interface RestEntityRequestBody extends CustomMetadata {
  /**
   * The type of the body.
   */
  type: 'json' | 'text' | 'binary' | 'form-data' | 'x-www-form-urlencoded';
  /**
   * The data of the body.
   */
  value: unknown;
}

export interface TestResult {
  /**
   * The test name.
   */
  test: string;
  /**
   * The result of the test.
   */
  result: 'pass' | 'fail' | 'skip';
  /**
   * The error message of the test in case of failure.
   */
  error: string | null;
}

export interface RestEntityMetadata {
  responseCache: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string | null;
  };
  requestCache: {
    binaryPaths: {
      // the mapping of the RequestBody.value[i].key to the file-system path to the binary file
      [key: string]: string | null;
    };
  };
  testResultCache: TestResult[];
}

/**
 * The data of the request.
 */
export interface RestEntityData extends CommonEntity {
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
   * The group id of the request.
   */
  groupId: string | null;
  /**
   * The headers of the request.
   */
  requestHeaders: TabularPair[];
  /**
   * The parameters of the request.
   */
  requestParameters: TabularPair[];
  /**
   * The search parameters of the request.
   */
  searchParameters: TabularPair[];
  /**
   * The body of the request.
   */
  requestBody: RestEntityRequestBody | null;
  /**
   * The script of this entity.
   */
  script: YasumuEmbeddedScript;
  /**
   * The test script of this entity.
   */
  testScript: YasumuEmbeddedScript;
  /**
   * The dependencies of this entity.
   */
  dependencies: string[];
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
  /**
   * The request parameters of this entity.
   */
  requestParameters?: TabularPair[];
  /**
   * The search parameters of this entity.
   */
  searchParameters?: TabularPair[];
  /**
   * The request headers of this entity.
   */
  requestHeaders?: TabularPair[];
  /**
   * The request body of this entity.
   */
  requestBody?: RestEntityRequestBody | null;
  /**
   * The script of this entity.
   */
  script?: YasumuEmbeddedScript;
  /**
   * The test script of this entity.
   */
  testScript?: YasumuEmbeddedScript;
  /**
   * The dependencies of this entity.
   */
  dependencies?: string[];
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
   * The group id of the request.
   */
  groupId?: string | null;
  /**
   * The request parameters of this entity.
   */
  requestParameters?: TabularPair[];
  /**
   * The search parameters of this entity.
   */
  searchParameters?: TabularPair[];
  /**
   * The request headers of this entity.
   */
  requestHeaders?: TabularPair[];
  /**
   * The request body of this entity.
   */
  requestBody?: RestEntityRequestBody | null;
  /**
   * The script of this entity.
   */
  script?: YasumuEmbeddedScript;
  /**
   * The test script of this entity.
   */
  testScript?: YasumuEmbeddedScript;
  /**
   * The dependencies of this entity.
   */
  dependencies?: string[];
}
