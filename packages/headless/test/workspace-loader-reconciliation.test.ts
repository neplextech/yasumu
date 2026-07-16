import { describe, expect, it } from 'vitest';

import type { WorkspaceSource } from '../src/index.js';
import { HeadlessWorkspaceLoader, reconcileThreeWay, stableHash, WorkspaceValidationError } from '../src/index.js';

const workspaceYsl = `@workspace
metadata {
  id: "workspace-1"
  name: "Fixture"
  version: 1
}
snapshot 1
groups {}
script null
`;

function restYsl(id: string, dependency = ''): string {
  return `@rest
metadata {
  name: "${id}"
  method: "GET"
  id: "${id}"
  groupId: null
}
request {
  url: "https://example.test/${id}"
  headers: []
  parameters: []
  searchParameters: []
  body: null
}
dependencies [${dependency ? `"${dependency}"` : ''}]
script null
test null
`;
}

function source(files: Array<{ path: string; content: string; revision?: string }>): WorkspaceSource {
  return { root: '/fixture/yasumu', list: async () => files };
}

describe('HeadlessWorkspaceLoader', () => {
  it('discovers and normalizes YSL deterministically with stable origins', async () => {
    const loader = new HeadlessWorkspaceLoader();
    const result = await loader.load(
      source([
        { path: 'rest/z.ysl', content: restYsl('z') },
        { path: 'workspace.ysl', content: workspaceYsl },
        { path: 'rest/a.ysl', content: restYsl('a', 'z') },
        { path: 'README.md', content: 'ignored' },
      ]),
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.workspace?.entities.map((entity) => entity.id)).toEqual(['a', 'z']);
    expect(result.workspace?.root).toBe('/fixture/yasumu');
    expect(result.workspace?.entities[0]?.origin).toMatchObject({ kind: 'ysl', path: 'rest/a.ysl' });
    expect(result.revisions['workspace.ysl']).toBe(stableHash(workspaceYsl));
  });

  it('reports every invalid file instead of silently skipping it', async () => {
    const result = await new HeadlessWorkspaceLoader().load(
      source([
        { path: 'workspace.ysl', content: workspaceYsl },
        { path: 'rest/bad.ysl', content: '@rest\nmetadata { id: "unterminated }' },
        { path: 'other.ysl', content: '@unknown\nvalue "x"' },
      ]),
    );

    expect(result.workspace).toBeUndefined();
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics.map((diagnostic) => diagnostic.file)).toEqual(['other.ysl', 'rest/bad.ysl']);
    expect(result.diagnostics.some((diagnostic) => diagnostic.range?.start.line)).toBe(true);
  });

  it('detects duplicate IDs, invalid references, and filename identity mismatches', async () => {
    const result = await new HeadlessWorkspaceLoader().load(
      source([
        { path: 'workspace.ysl', content: workspaceYsl },
        { path: 'one/same.ysl', content: restYsl('same', 'missing') },
        { path: 'two/same.ysl', content: restYsl('same') },
        { path: 'rest/wrong-name.ysl', content: restYsl('actual-name') },
      ]),
    );

    expect(result.workspace).toBeUndefined();
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining(['DUPLICATE_ENTITY_ID', 'INVALID_REFERENCE', 'INVALID_YSL']),
    );
    await expect(new HeadlessWorkspaceLoader().loadOrThrow(source([]))).rejects.toBeInstanceOf(
      WorkspaceValidationError,
    );
  });

  it('reuses revision-aware parsing while returning fresh normalized models', async () => {
    let content = restYsl('cached');
    const files = [
      { path: 'workspace.ysl', content: workspaceYsl, revision: 'workspace-r1' },
      { path: 'rest/cached.ysl', content, revision: 'entity-r1' },
    ];
    const loader = new HeadlessWorkspaceLoader();
    const first = await loader.load(source(files));
    first.workspace!.entities[0]!.name = 'mutated consumer state';
    content = restYsl('cached').replace('name: "cached"', 'name: "Changed"');
    files[1] = { path: 'rest/cached.ysl', content, revision: 'entity-r2' };
    const second = await loader.load(source(files));

    expect(second.workspace?.entities[0]?.name).toBe('Changed');
    expect(second.revisions['rest/cached.ysl']).toBe('entity-r2');
  });
});

describe('three-way reconciliation', () => {
  it.each([
    [{ id: 'a' }, { id: 'a' }, { id: 'a' }, 'unchanged'],
    [undefined, { id: 'a' }, undefined, 'source-added'],
    [{ id: 'a' }, { id: 'b' }, { id: 'a' }, 'source-updated'],
    [{ id: 'a' }, { id: 'a' }, { id: 'b' }, 'database-updated'],
    [{ id: 'a' }, undefined, { id: 'a' }, 'source-deleted'],
  ] as const)('classifies %s / %s / %s as %s', (base, currentSource, database, status) => {
    expect(reconcileThreeWay(base, currentSource, database).status).toBe(status);
  });

  it('auto-merges disjoint object changes and exposes field-level conflicts', () => {
    expect(
      reconcileThreeWay(
        { name: 'old', metadata: { enabled: false, count: 1 } },
        { name: 'source', metadata: { enabled: false, count: 1 } },
        { name: 'old', metadata: { enabled: true, count: 1 } },
      ),
    ).toMatchObject({
      status: 'auto-merged',
      merged: { name: 'source', metadata: { enabled: true, count: 1 } },
      conflicts: [],
    });

    const conflict = reconcileThreeWay({ value: 1 }, { value: 2 }, { value: 3 });
    expect(conflict.status).toBe('conflict');
    expect(conflict.conflicts).toEqual([{ path: ['value'], base: 1, source: 2, database: 3 }]);
  });
});
