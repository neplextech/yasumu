import {
  HttpMethod,
  RestEntityRequestBody,
  TabularPair,
  YasumuEmbeddedScript,
} from '@yasumu/common';
import type {
  PostmanAuth,
  PostmanBody,
  PostmanCollection,
  PostmanHeader,
  PostmanItem,
  PostmanUrlPath,
} from './types.ts';
import {
  YasumuWorkspaceFormat,
  YasumuWorkspaceFormatEntityGroup,
  YasumuWorkspaceFormatEnvironment,
  YasumuWorkspaceFormatRest,
} from '../common/yasumu-workspace-format.ts';
import { PostmanScriptTransformer } from './script-transformer.ts';
import { looksLikeJson, prepend } from './utils.ts';

export class PostmanCollectionImporter {
  private readonly scriptTransformer = new PostmanScriptTransformer();

  public importCollection(
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

    if (collectionVariables.length) {
      environments.push({
        id: Yasumu.cuid(),
        name: collection.info?.name
          ? `${collection.info.name} Variables`
          : 'Imported Variables',
        variables: collectionVariables,
        secrets: [],
      });
    }

    const collectionScripts = this.scriptTransformer.extractScripts(
      collection.event,
    );

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

        const folderScripts = this.scriptTransformer.extractScripts(item.event);
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
    const headers = this.extractHeaders(request.header, request.auth);
    const { parameters, searchParameters } = this.extractParameters(
      request.url,
    );
    const body = this.extractBody(request.body);
    const itemScripts = this.scriptTransformer.extractScripts(item.event);

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

  private extractHeaders(
    headers: PostmanHeader[] | undefined,
    auth: PostmanAuth | undefined,
  ): TabularPair[] {
    if (!headers && !(auth?.basic?.length || auth?.bearer?.length)) return [];

    const baseHeaders =
      headers?.map((h) => ({
        key: h.key,
        value: h.value ?? '',
        enabled: h.disabled !== true,
      })) ?? [];

    if (auth?.basic?.length) {
      baseHeaders.push({
        key: 'Authorization',
        value: prepend(auth.basic[0].value ?? '', 'Basic '),
        enabled: auth.basic[0].disabled !== true,
      });
    }

    if (auth?.bearer?.length) {
      baseHeaders.push({
        key: 'Authorization',
        value: prepend(auth.bearer[0].value ?? '', 'Bearer '),
        enabled: auth.bearer[0].disabled !== true,
      });
    }

    return baseHeaders;
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
          language === 'json' || (body.raw && looksLikeJson(body.raw));

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
}
