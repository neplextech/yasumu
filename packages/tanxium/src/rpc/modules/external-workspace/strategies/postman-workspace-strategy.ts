import {
  ExternalWorkspaceImportStrategy,
  HttpMethod,
  TabularPair,
  RestEntityRequestBody,
  YasumuEmbeddedScript,
  YasumuScriptingLanguage,
} from '@yasumu/common';
import { ExternalWorkspaceStrategy } from './common/external-workspace-strategy.ts';
import { NotImplementedException } from '../../common/exceptions/http.exception.ts';
import {
  YasumuWorkspaceFormat,
  YasumuWorkspaceFormatEnvironment,
  YasumuWorkspaceFormatRest,
  YasumuWorkspaceFormatEntityGroup,
} from './common/yasumu-workspace-format.ts';
import { MaybePromise } from '../../../../common/types.ts';

interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
  disabled?: boolean;
}

interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanQueryParam {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanUrlPath {
  raw?: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: PostmanQueryParam[];
  variable?: PostmanVariable[];
}

interface PostmanBody {
  mode?: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql';
  raw?: string;
  urlencoded?: Array<{ key: string; value: string; disabled?: boolean }>;
  formdata?: Array<{
    key: string;
    value: string;
    type?: string;
    disabled?: boolean;
  }>;
  options?: {
    raw?: {
      language?: string;
    };
  };
}

interface PostmanRequest {
  method: string;
  header?: PostmanHeader[];
  body?: PostmanBody;
  url?: string | PostmanUrlPath;
}

interface PostmanEvent {
  listen: 'prerequest' | 'test';
  script?: {
    exec?: string[];
    type?: string;
  };
}

interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  response?: unknown[];
  item?: PostmanItem[];
  event?: PostmanEvent[];
}

interface PostmanEnvironment {
  name: string;
  values: Array<{
    key: string;
    value: string;
    type?: string;
    enabled?: boolean;
  }>;
}

interface PostmanCollection {
  info?: {
    name?: string;
    schema?: string;
  };
  item?: PostmanItem[];
  variable?: PostmanVariable[];
  event?: PostmanEvent[];
}

export class PostmanWorkspaceStrategy implements ExternalWorkspaceStrategy {
  public readonly name = ExternalWorkspaceImportStrategy.Postman;

  public import(content: string): MaybePromise<YasumuWorkspaceFormat> {
    const parsed = JSON.parse(content);

    if (this.isPostmanEnvironment(parsed)) {
      return this.importEnvironment(parsed);
    }

    return this.importCollection(parsed as PostmanCollection);
  }

  private isPostmanEnvironment(parsed: unknown): parsed is PostmanEnvironment {
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'values' in parsed &&
      Array.isArray((parsed as PostmanEnvironment).values)
    );
  }

  private importEnvironment(env: PostmanEnvironment): YasumuWorkspaceFormat {
    const variables: TabularPair[] = [];
    const secrets: TabularPair[] = [];

    for (const val of env.values) {
      const pair: TabularPair = {
        key: val.key,
        value: val.value ?? '',
        enabled: val.enabled !== false,
      };

      if (val.type === 'secret') {
        secrets.push(pair);
      } else {
        variables.push(pair);
      }
    }

    return {
      environments: [
        {
          id: Yasumu.cuid(),
          name: env.name || 'Imported Environment',
          variables,
          secrets,
        },
      ],
      rest: [],
      entityGroups: [],
    };
  }

  private importCollection(
    collection: PostmanCollection,
  ): YasumuWorkspaceFormat {
    const entityGroups: YasumuWorkspaceFormatEntityGroup[] = [];
    const rest: YasumuWorkspaceFormatRest[] = [];
    const environments: YasumuWorkspaceFormatEnvironment[] = [];

    const collectionVariables: TabularPair[] = (collection.variable ?? []).map(
      (v) => ({
        key: v.key,
        value: v.value ?? '',
        enabled: v.disabled !== true,
      }),
    );

    environments.push({
      id: Yasumu.cuid(),
      name: collection.info?.name
        ? `${collection.info.name} Variables`
        : 'Imported Variables',
      variables: collectionVariables,
      secrets: [],
    });

    const collectionScripts = this.extractScripts(collection.event);

    if (collection.item) {
      this.processItems(
        collection.item,
        null,
        entityGroups,
        rest,
        collectionScripts,
      );
    }

    return { environments, rest, entityGroups };
  }

  private processItems(
    items: PostmanItem[],
    parentGroupId: string | null,
    entityGroups: YasumuWorkspaceFormatEntityGroup[],
    rest: YasumuWorkspaceFormatRest[],
    inheritedScripts: {
      script: YasumuEmbeddedScript | null;
      testScript: YasumuEmbeddedScript | null;
    },
  ): void {
    for (const item of items) {
      if (item.item && item.item.length > 0) {
        const groupId = Yasumu.cuid();

        entityGroups.push({
          id: groupId,
          name: item.name,
          parentId: parentGroupId,
          children: [],
        });

        const folderScripts = this.extractScripts(item.event);
        const mergedScripts = {
          script: folderScripts.script ?? inheritedScripts.script,
          testScript: folderScripts.testScript ?? inheritedScripts.testScript,
        };

        this.processItems(
          item.item,
          groupId,
          entityGroups,
          rest,
          mergedScripts,
        );
      } else if (item.request) {
        rest.push(this.convertRequest(item, parentGroupId, inheritedScripts));
      }
    }
  }

  private convertRequest(
    item: PostmanItem,
    groupId: string | null,
    inheritedScripts: {
      script: YasumuEmbeddedScript | null;
      testScript: YasumuEmbeddedScript | null;
    },
  ): YasumuWorkspaceFormatRest {
    const request = item.request!;
    const url = this.extractUrl(request.url);
    const method = this.normalizeMethod(request.method);
    const headers = this.extractHeaders(request.header);
    const { parameters, searchParameters } = this.extractParameters(
      request.url,
    );
    const body = this.extractBody(request.body);
    const itemScripts = this.extractScripts(item.event);

    return {
      id: Yasumu.cuid(),
      name: item.name,
      url,
      groupId,
      method,
      headers,
      body,
      parameters,
      searchParameters,
      script: itemScripts.script ?? inheritedScripts.script,
      testScript: itemScripts.testScript ?? inheritedScripts.testScript,
      dependencies: [],
    };
  }

  private extractUrl(url: string | PostmanUrlPath | undefined): string {
    if (!url) return '';

    if (typeof url === 'string') return url;

    if (url.raw) return url.raw;

    let result = '';

    if (url.protocol) {
      result += `${url.protocol}://`;
    }

    if (url.host) {
      result += url.host.join('.');
    }

    if (url.path) {
      result += '/' + url.path.join('/');
    }

    return result;
  }

  private normalizeMethod(method: string | undefined): HttpMethod {
    if (!method) return 'GET';

    const upper = method.toUpperCase();
    const validMethods = [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS',
      'HEAD',
    ];

    return validMethods.includes(upper) ? (upper as HttpMethod) : 'GET';
  }

  private extractHeaders(headers: PostmanHeader[] | undefined): TabularPair[] {
    if (!headers) return [];

    return headers.map((h) => ({
      key: h.key,
      value: h.value ?? '',
      enabled: h.disabled !== true,
    }));
  }

  private extractParameters(url: string | PostmanUrlPath | undefined): {
    parameters: TabularPair[];
    searchParameters: TabularPair[];
  } {
    const parameters: TabularPair[] = [];
    const searchParameters: TabularPair[] = [];

    if (!url || typeof url === 'string') {
      if (typeof url === 'string' && url.includes('?')) {
        const queryString = url.split('?')[1];
        if (queryString) {
          const params = new URLSearchParams(queryString);
          params.forEach((value, key) => {
            searchParameters.push({ key, value, enabled: true });
          });
        }
      }
      return { parameters, searchParameters };
    }

    if (url.variable) {
      for (const v of url.variable) {
        parameters.push({
          key: v.key,
          value: v.value ?? '',
          enabled: v.disabled !== true,
        });
      }
    }

    if (url.query) {
      for (const q of url.query) {
        searchParameters.push({
          key: q.key,
          value: q.value ?? '',
          enabled: q.disabled !== true,
        });
      }
    }

    return { parameters, searchParameters };
  }

  private extractBody(
    body: PostmanBody | undefined,
  ): RestEntityRequestBody | null {
    if (!body || !body.mode) return null;

    switch (body.mode) {
      case 'raw': {
        const language = body.options?.raw?.language;
        const isJson =
          language === 'json' || (body.raw && this.looksLikeJson(body.raw));

        return {
          type: isJson ? 'json' : 'text',
          value: body.raw ?? '',
          metadata: null,
        };
      }

      case 'urlencoded': {
        const pairs: TabularPair[] = (body.urlencoded ?? []).map((p) => ({
          key: p.key,
          value: p.value ?? '',
          enabled: p.disabled !== true,
        }));

        return {
          type: 'x-www-form-urlencoded',
          value: pairs,
          metadata: null,
        };
      }

      case 'formdata': {
        const pairs: TabularPair[] = (body.formdata ?? []).map((p) => ({
          key: p.key,
          value: p.value ?? '',
          enabled: p.disabled !== true,
        }));

        return {
          type: 'form-data',
          value: pairs,
          metadata: null,
        };
      }

      default:
        return null;
    }
  }

  private looksLikeJson(str: string): boolean {
    const trimmed = str.trim();
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    );
  }

  private extractScripts(events: PostmanEvent[] | undefined): {
    script: YasumuEmbeddedScript | null;
    testScript: YasumuEmbeddedScript | null;
  } {
    if (!events) return { script: null, testScript: null };

    const preRequestCode: string[] = [];
    const responseCode: string[] = [];
    const testCode: string[] = [];

    for (const event of events) {
      if (!event.script?.exec || event.script.exec.length === 0) continue;

      const rawCode = event.script.exec.join('\n');
      const convertedCode = this.convertPostmanScript(rawCode);

      if (event.listen === 'prerequest') {
        preRequestCode.push(convertedCode);
      } else {
        const { tests, pre } = this.extractCode(convertedCode);
        if (pre.length > 0) {
          responseCode.push(pre.join('\n'));
        }
        testCode.push(...tests);
      }
    }

    const blocks: string[] = [];
    const imports: string[] = [];

    if (preRequestCode.length) {
      blocks.push(
        `export function onRequest(req: YasumuRequest) {\n${this.indentCode(preRequestCode.join('\n'))}\n}`,
      );
    }

    if (responseCode.length) {
      blocks.push(
        `export function onResponse(req: YasumuRequest, res: YasumuResponse) {\n${this.indentCode(responseCode.join('\n'))}\n}`,
      );
    }

    if (testCode.length) {
      blocks.push(
        `export function onTest(req: YasumuRequest, res: YasumuResponse) {\n${this.indentCode(testCode.join('\n\n'))}\n}`,
      );
    }

    if (!blocks.length) return { script: null, testScript: null };

    const codeOutput = [...imports, '', ...blocks].join('\n').trim();

    const script: YasumuEmbeddedScript = {
      language: YasumuScriptingLanguage.JavaScript,
      code: codeOutput,
    };

    return { script, testScript: null };
  }

  private extractCode(code: string): { tests: string[]; pre: string[] } {
    const tests: string[] = [];
    const preLines: string[] = [];
    const lines = code.split('\n');

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const testMatch = line.match(/pm\.test\s*\(/);

      if (testMatch) {
        const testBlock = this.extractPmTestBlock(lines, i);
        tests.push(this.convertPmTestToYasumu(testBlock.code));
        i = testBlock.endIndex + 1;
      } else {
        preLines.push(line);
        i++;
      }
    }

    return { tests, pre: preLines.filter((l) => l.trim().length > 0) };
  }

  private extractPmTestBlock(
    lines: string[],
    startIndex: number,
  ): { code: string; endIndex: number } {
    let depth = 0;
    let started = false;
    let endIndex = startIndex;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === '(' || char === '{') {
          depth++;
          started = true;
        } else if (char === ')' || char === '}') {
          depth--;
        }
      }

      if (started && depth === 0) {
        endIndex = i;
        break;
      }
    }

    const block = lines.slice(startIndex, endIndex + 1).join('\n');
    return { code: block, endIndex };
  }

  private convertPmTestToYasumu(pmTestCode: string): string {
    const nameMatch = pmTestCode.match(/pm\.test\s*\(\s*(['"`])(.+?)\1/);
    const testName = nameMatch ? nameMatch[2] : 'Untitled test';

    const bodyMatch = pmTestCode.match(
      /pm\.test\s*\([^,]+,\s*(?:async\s*)?\(?.*?\)?\s*=>\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/,
    );

    if (!bodyMatch) {
      const fnBodyMatch = pmTestCode.match(
        /pm\.test\s*\([^,]+,\s*function\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/,
      );
      const body = fnBodyMatch ? fnBodyMatch[1].trim() : '';
      return this.wrapInYasumuTest(testName, body);
    }

    return this.wrapInYasumuTest(testName, bodyMatch[1].trim());
  }

  private wrapInYasumuTest(name: string, body: string): string {
    const convertedBody = this.convertExpectations(body);
    const maybeAsync = [' async ', 'async '].some((s) =>
      convertedBody.includes(s),
    )
      ? 'async'
      : '';

    return `Deno.test('${name}', ${maybeAsync}() => {\n${this.indentCode(convertedBody)}\n});`;
  }

  private convertExpectations(code: string): string {
    let result = code;

    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.eql\(([^)]+)\)/g,
      'expect($1).toEqual($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.equal\(([^)]+)\)/g,
      'expect($1).toBe($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.true/g,
      'expect($1).toBe(true)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.false/g,
      'expect($1).toBe(false)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.null/g,
      'expect($1).toBeNull()',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.undefined/g,
      'expect($1).toBeUndefined()',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.have\.property\(([^)]+)\)/g,
      'expect($1).toHaveProperty($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.include\(([^)]+)\)/g,
      'expect($1).toContain($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.have\.lengthOf\(([^)]+)\)/g,
      'expect($1).toHaveLength($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.above\(([^)]+)\)/g,
      'expect($1).toBeGreaterThan($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.below\(([^)]+)\)/g,
      'expect($1).toBeLessThan($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.exist/g,
      'expect($1).toBeDefined()',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.ok/g,
      'expect($1).toBeTruthy()',
    );

    return result;
  }

  private convertPostmanScript(code: string): string {
    let converted = code;

    converted = converted.replace(
      /pm\.environment\.get\(([^)]+)\)/g,
      'req.env.getSecret($1)',
    );
    converted = converted.replace(
      /pm\.environment\.set\(([^,]+),\s*([^)]+)\)/g,
      'req.env.setSecret($1, $2)',
    );
    converted = converted.replace(
      /pm\.variables\.get\(([^)]+)\)/g,
      'req.env.getVariable($1)',
    );
    converted = converted.replace(
      /pm\.variables\.set\(([^,]+),\s*([^)]+)\)/g,
      'req.env.setVariable($1, $2)',
    );
    converted = converted.replace(
      /pm\.globals\.get\(([^)]+)\)/g,
      'req.env.getVariable($1)',
    );
    converted = converted.replace(
      /pm\.globals\.set\(([^,]+),\s*([^)]+)\)/g,
      'req.env.setVariable($1, $2)',
    );
    converted = converted.replace(
      /pm\.collectionVariables\.get\(([^)]+)\)/g,
      'req.env.getVariable($1)',
    );
    converted = converted.replace(
      /pm\.collectionVariables\.set\(([^,]+),\s*([^)]+)\)/g,
      'req.env.setVariable($1, $2)',
    );

    converted = converted.replace(/pm\.request\.url/g, 'req.url');
    converted = converted.replace(/pm\.request\.method/g, 'req.method');
    converted = converted.replace(
      /pm\.request\.headers\.get\(([^)]+)\)/g,
      'req.headers.get($1)',
    );
    converted = converted.replace(
      /pm\.request\.headers\.add\(\{[^}]*key:\s*([^,]+),\s*value:\s*([^}]+)\}\)/g,
      'req.headers.set($1, $2)',
    );
    converted = converted.replace(/pm\.request\.body/g, 'req.body');

    converted = converted.replace(/pm\.response\.code/g, 'res.status');
    converted = converted.replace(/pm\.response\.status/g, 'res.statusText');
    converted = converted.replace(
      /pm\.response\.headers\.get\(([^)]+)\)/g,
      'res.headers.get($1)',
    );
    converted = converted.replace(/pm\.response\.json\(\)/g, 'res.json()');
    converted = converted.replace(/pm\.response\.text\(\)/g, 'res.text()');
    converted = converted.replace(/pm\.response\.responseTime/g, '0');

    return converted;
  }

  private indentCode(code: string): string {
    return code
      .split('\n')
      .map((line) => `  ${line.trim()}`)
      .join('\n');
  }

  // deno-lint-ignore require-await
  public async export(_workspace: YasumuWorkspaceFormat): Promise<unknown> {
    throw new NotImplementedException('Exporting to Postman is not supported');
  }
}
