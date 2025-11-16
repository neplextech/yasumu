import { YasumuScriptingLanguage } from '@/common/constants.ts';
import { KeyValuePair } from '@/common/types.ts';
import { commonColumns, json } from '../../common/index.ts';
import { cuid } from '../../common/index.ts';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

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

/**
 * Embeddable script for Yasumu. This contains the code that will be executed during pre-request, post-response, and test scripts.
 */
export interface YasumuEmbeddedScript {
  /**
   * The language of the script.
   */
  language: YasumuScriptingLanguage;
  /**
   * The code of the script.
   */
  code: string;
}

export interface RequestBody {
  type: 'text' | 'json' | 'form-data' | 'urlencoded';
  value:
    | string
    | KeyValuePair<{
        type: 'text' | 'binary';
      }>[];
}

export const restEntities = sqliteTable('rest_entity', {
  ...commonColumns<RestEntityMetadata>(),
  restId: cuid('restId').notNull(),
  method: text('method').notNull(),
  url: text('url'),
  requestParameters: json<KeyValuePair[]>('requestParameters'),
  requestHeaders: json<KeyValuePair[]>('requestHeaders'),
  requestBody: json<RequestBody>('requestBody'),
  script: json<YasumuEmbeddedScript>('script'),
  testScript: json<YasumuEmbeddedScript>('testScript'),
});

export const restEntityDependencies = sqliteTable('rest_entity_dependency', {
  ...commonColumns(),
  restEntityId: cuid('restEntityId').notNull(),
  dependsOnId: cuid('dependsOnId').notNull(),
});
