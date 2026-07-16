import { describe, expect, it } from 'vitest';

import type { FileTreeItem } from './file-tree-model';
import {
  buildFileTreeIndex,
  canMoveFileTreeItem,
  collectFolderIds,
  getAncestorFolderIds,
  getFileTreeCreationParentId,
  getFileTreeItemKey,
  getNearestVisibleAncestor,
  getSearchableFileTreeItems,
  getVisibleFileTreeRows,
  isFileTreeDescendant,
} from './file-tree-model';

const TREE: FileTreeItem[] = [
  {
    id: 'requests',
    name: 'Requests',
    type: 'folder',
    children: [
      {
        id: 'users',
        name: 'Users',
        type: 'folder',
        children: [
          { id: 'get-user', name: 'Get user', type: 'file' },
          { id: 'create-user', name: 'Create user', type: 'file' },
        ],
      },
      { id: 'health', name: 'Health', type: 'file' },
    ],
  },
  { id: 'root-request', name: 'Root request', type: 'file' },
];

describe('file tree model', () => {
  it('builds a stable pre-order index with semantic row metadata', () => {
    const index = buildFileTreeIndex(TREE);

    expect(index.rows.map((row) => row.key)).toEqual([
      'folder:requests',
      'folder:users',
      'file:get-user',
      'file:create-user',
      'file:health',
      'file:root-request',
    ]);
    expect(index.rowByKey.get('file:create-user')).toMatchObject({
      depth: 2,
      parentKey: 'folder:users',
      positionInSet: 2,
      setSize: 2,
    });
    expect(collectFolderIds(index)).toEqual(new Set(['requests', 'users']));
  });

  it('returns only rows with an expanded ancestor chain', () => {
    const index = buildFileTreeIndex(TREE);

    expect(getVisibleFileTreeRows(index, new Set()).map((row) => row.key)).toEqual([
      'folder:requests',
      'file:root-request',
    ]);
    expect(getVisibleFileTreeRows(index, new Set(['requests'])).map((row) => row.key)).toEqual([
      'folder:requests',
      'folder:users',
      'file:health',
      'file:root-request',
    ]);
    expect(getVisibleFileTreeRows(index, new Set(['requests', 'users'])).map((row) => row.key)).toEqual(
      index.rows.map((row) => row.key),
    );
  });

  it('derives search paths and folder ancestors without storing duplicate tree state', () => {
    const index = buildFileTreeIndex(TREE);

    expect(getAncestorFolderIds(index, 'file:get-user')).toEqual(['requests', 'users']);
    expect(getSearchableFileTreeItems(index)).toEqual([
      expect.objectContaining({
        key: 'file:get-user',
        path: 'Requests/Users/Get user',
        ancestorFolderIds: ['requests', 'users'],
      }),
      expect.objectContaining({
        key: 'file:create-user',
        path: 'Requests/Users/Create user',
        ancestorFolderIds: ['requests', 'users'],
      }),
      expect.objectContaining({
        key: 'file:health',
        path: 'Requests/Health',
        ancestorFolderIds: ['requests'],
      }),
      expect.objectContaining({
        key: 'file:root-request',
        path: 'Root request',
        ancestorFolderIds: [],
      }),
    ]);
  });

  it('derives create destinations from the selected row instead of stale folder state', () => {
    const index = buildFileTreeIndex(TREE);

    expect(getFileTreeCreationParentId(index, 'folder:users', 'requests')).toBe('users');
    expect(getFileTreeCreationParentId(index, 'file:get-user', 'requests')).toBe('users');
    expect(getFileTreeCreationParentId(index, 'file:root-request', 'requests')).toBeNull();
    expect(getFileTreeCreationParentId(index, null, 'requests')).toBe('requests');
  });

  it('keeps identity stable across rename and reorder operations', () => {
    const original = buildFileTreeIndex(TREE);
    const updated = buildFileTreeIndex([{ id: 'root-request', name: 'Renamed root request', type: 'file' }, TREE[0]!]);

    expect(getFileTreeItemKey(original.rowByKey.get('file:root-request')!.item)).toBe('file:root-request');
    expect(getFileTreeItemKey(updated.rowByKey.get('file:root-request')!.item)).toBe('file:root-request');
  });

  it('finds descendants and the nearest row that remains visible after collapse', () => {
    const index = buildFileTreeIndex(TREE);
    const visibleRows = getVisibleFileTreeRows(index, new Set(['requests']));
    const visibleKeys = new Set(visibleRows.map((row) => row.key));

    expect(isFileTreeDescendant(index, 'file:get-user', 'folder:requests')).toBe(true);
    expect(isFileTreeDescendant(index, 'folder:requests', 'folder:users')).toBe(false);
    expect(getNearestVisibleAncestor(index, 'file:get-user', visibleKeys)?.key).toBe('folder:users');
  });

  it('rejects folder moves into self or descendants while allowing safe moves', () => {
    const index = buildFileTreeIndex(TREE);

    expect(canMoveFileTreeItem(index, 'folder', 'requests', 'requests')).toBe(false);
    expect(canMoveFileTreeItem(index, 'folder', 'requests', 'users')).toBe(false);
    expect(canMoveFileTreeItem(index, 'folder', 'users', null)).toBe(true);
    expect(canMoveFileTreeItem(index, 'folder', 'users', 'requests')).toBe(true);
    expect(canMoveFileTreeItem(index, 'file', 'health', 'users')).toBe(true);
    expect(canMoveFileTreeItem(index, 'folder', 'missing', 'requests')).toBe(false);
    expect(canMoveFileTreeItem(index, 'file', 'health', 'missing')).toBe(false);
  });

  it('indexes and expands a deeply nested tree without recursion', () => {
    const depth = 10_000;
    let item: FileTreeItem = { id: 'leaf', name: 'Leaf', type: 'file' };

    for (let index = depth - 1; index >= 0; index -= 1) {
      item = {
        id: `folder-${index}`,
        name: `Folder ${index}`,
        type: 'folder',
        children: [item],
      };
    }

    const treeIndex = buildFileTreeIndex([item]);
    const visibleRows = getVisibleFileTreeRows(treeIndex, collectFolderIds(treeIndex));

    expect(treeIndex.rows).toHaveLength(depth + 1);
    expect(visibleRows.at(-1)?.key).toBe('file:leaf');
    expect(visibleRows.at(-1)?.depth).toBe(depth);
  });

  it('handles a large flat workspace while retaining stable row keys', () => {
    const size = 25_000;
    const items: FileTreeItem[] = Array.from({ length: size }, (_, index) => ({
      id: `file-${index}`,
      name: `File ${index}`,
      type: 'file',
    }));

    const index = buildFileTreeIndex(items);
    const visibleRows = getVisibleFileTreeRows(index, new Set());

    expect(visibleRows).toHaveLength(size);
    expect(visibleRows[12_345]?.key).toBe('file:file-12345');
  });
});
