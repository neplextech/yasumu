import { describe, expect, it } from 'vitest';

import type { FileOpenResult, FileResolver } from '../src/index.js';
import { buildEntityRequest } from '../src/index.js';
import { graphqlEntity, restEntity, sseEntity, workspace } from './fixtures.js';

const environment = {
  variables: { host: 'api.example.test', userId: 'a/b', enabled: true, count: 3 },
  secrets: { TOKEN: 'secret-token' },
};

describe('request construction', () => {
  it('builds REST URLs, headers, search parameters, and typed JSON bodies', async () => {
    const entity = restEntity({
      method: 'POST',
      url: 'https://{{host}}/users/:id',
      pathParameters: [{ key: 'id', value: '{{userId}}', enabled: true }],
      searchParameters: [
        { key: 'active', value: '{{enabled}}', enabled: true },
        { key: 'ignored', value: 'x', enabled: false },
      ],
      headers: [{ key: 'authorization', value: 'Bearer {{TOKEN}}', enabled: true }],
      body: { type: 'json', value: { count: '{{count}}', enabled: '{{enabled}}' } },
    });
    const request = await buildEntityRequest(workspace({ entities: [entity] }), entity, {
      environment,
      pathParameters: { id: 'override/value' },
    });

    expect(request.url).toBe('https://api.example.test/users/override%2Fvalue?active=true');
    expect(request.headers.get('authorization')).toBe('Bearer secret-token');
    expect(request.headers.get('content-type')).toBe('application/json');
    expect(await request.json()).toEqual({ count: 3, enabled: true });
  });

  it('specializes GraphQL as a POST while sharing URL and header behavior', async () => {
    const entity = graphqlEntity({
      url: 'https://{{host}}/graphql',
      searchParameters: [{ key: 'tenant', value: '{{userId}}', enabled: true }],
      headers: [{ key: 'x-token', value: '{{TOKEN}}', enabled: true }],
      body: {
        query: 'query Viewer($enabled: Boolean!) { viewer(enabled: $enabled) { id } }',
        variables: { enabled: '{{enabled}}' },
        operationName: 'Viewer',
      },
    });
    const request = await buildEntityRequest(workspace({ entities: [entity] }), entity, { environment });

    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api.example.test/graphql?tenant=a%2Fb');
    expect(await request.json()).toEqual({
      query: 'query Viewer($enabled: Boolean!) { viewer(enabled: $enabled) { id } }',
      variables: { enabled: true },
      operationName: 'Viewer',
    });
  });

  it('interpolates GraphQL JSON variables after parsing so typed values remain valid JSON', async () => {
    const entity = graphqlEntity({
      body: {
        query: 'query Viewer($enabled: Boolean!, $profile: JSON!) { viewer { id } }',
        variables: '{"enabled":"{{enabled}}","profile":"{{profile}}"}',
      },
    });
    const request = await buildEntityRequest(workspace({ entities: [entity] }), entity, {
      environment: { ...environment, variables: { ...environment.variables, profile: { name: 'Ada' } } },
    });

    expect((await request.json()).variables).toEqual({ enabled: true, profile: { name: 'Ada' } });
  });

  it('builds fully interpolated SSE requests including method, headers, path, query, and body', async () => {
    const entity = sseEntity({
      method: 'POST',
      url: 'https://{{host}}/streams/:id',
      headers: [{ key: 'authorization', value: 'Bearer {{TOKEN}}', enabled: true }],
      pathParameters: [{ key: 'id', value: '{{userId}}', enabled: true }],
      searchParameters: [{ key: 'count', value: '{{count}}', enabled: true }],
      body: { type: 'json', value: '{"enabled":"{{enabled}}","count":"{{count}}"}' },
    });
    const request = await buildEntityRequest(workspace({ entities: [entity] }), entity, { environment });

    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api.example.test/streams/a%2Fb?count=3');
    expect(request.headers.get('authorization')).toBe('Bearer secret-token');
    expect(request.headers.get('accept')).toBe('text/event-stream');
    expect(await request.json()).toEqual({ enabled: true, count: 3 });
  });

  it('resolves binary and multipart files through the injected resolver', async () => {
    const opened: string[] = [];
    const resolver: FileResolver = {
      async resolve(_workspace, path) {
        return { id: path, name: path, source: { type: 'workspace-path', path } };
      },
      async open(_workspace, reference): Promise<FileOpenResult> {
        opened.push(reference.id);
        return {
          file: { ...reference, name: 'payload.txt', mimeType: 'text/plain' },
          blob: new Blob(['payload'], { type: 'text/plain' }),
        };
      },
    };
    const entity = restEntity({
      method: 'POST',
      body: {
        type: 'form-data',
        value: [
          { kind: 'text', key: 'label', value: '{{userId}}', enabled: true },
          {
            kind: 'file',
            key: 'upload',
            enabled: true,
            file: { id: 'file-1', name: 'payload.txt', source: { type: 'workspace-path', path: 'payload.txt' } },
          },
        ],
      },
    });
    const request = await buildEntityRequest(workspace({ entities: [entity] }), entity, {
      environment,
      fileResolver: resolver,
    });
    const form = await request.formData();

    expect(form.get('label')).toBe('a/b');
    expect(await (form.get('upload') as File).text()).toBe('payload');
    expect(opened).toEqual(['file-1']);
    expect(request.headers.get('content-type')).toContain('multipart/form-data; boundary=');
  });
});
