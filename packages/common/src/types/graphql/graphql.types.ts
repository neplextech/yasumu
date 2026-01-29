import type {
  CommonEntity,
  CustomMetadata,
  TabularPair,
  TestResult,
  YasumuEmbeddedScript,
} from '../common/common.types.js';

/**
 * The body of the request.
 */
export interface GraphqlEntityRequestBody extends CustomMetadata {
  /**
   * The type of the body.
   */
  type: 'json' | 'text' | 'binary' | 'form-data' | 'x-www-form-urlencoded';
  /**
   * The data of the body.
   */
  value: unknown;
}

export interface GraphqlEntityMetadata {
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
export interface GraphqlEntityData extends CommonEntity {
  /**
   * The name of the request.
   */
  name: string | null;
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
  requestBody: GraphqlEntityRequestBody | null;
  /**
   * The script of this entity.
   */
  script: YasumuEmbeddedScript;
  /**
   * The dependencies of this entity.
   */
  dependencies: string[];
}

/**
 * The options for creating a new rest entity.
 */
export interface GraphqlEntityCreateOptions extends CustomMetadata {
  /**
   * The name of the request.
   */
  name: string;
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
  requestBody?: GraphqlEntityRequestBody | null;
  /**
   * The script of this entity.
   */
  script?: YasumuEmbeddedScript;
  /**
   * The dependencies of this entity.
   */
  dependencies?: string[];
}

/**
 * The options for updating a rest entity.
 */
export interface GraphqlEntityUpdateOptions extends CustomMetadata {
  /**
   * The name of the request.
   */
  name?: string;
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
  requestBody?: GraphqlEntityRequestBody | null;
  /**
   * The script of this entity.
   */
  script?: YasumuEmbeddedScript;
  /**
   * The dependencies of this entity.
   */
  dependencies?: string[];
}

/**
 * A folder in the REST entity tree.
 */
export interface GraphqlTreeFolder {
  id: string;
  name: string;
  type: 'folder';
  parentId: string | null;
  workspaceId: string;
  entityType: string;
  children: GraphqlTreeItem[];
}

/**
 * A file (GRAPHQL request) in the GRAPHQL entity tree.
 */
export interface GraphqlTreeFile {
  id: string;
  name: string | null;
  type: 'file';
  url: string | null;
  groupId: string | null;
  workspaceId: string;
}

/**
 * An item in the REST entity tree (either a folder or a file).
 */
export type GraphqlTreeItem = GraphqlTreeFolder | GraphqlTreeFile;
