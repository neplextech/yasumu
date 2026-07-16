import { describe, expect, it } from 'vitest';

import type { FileTreeItem } from '@/components/sidebars/file-tree-model';

import type { WorkspaceTreeFile, WorkspaceTreeFolder } from './file-tree-utils';
import { findFolderInWorkspaceTree, flattenWorkspaceFolders, mapWorkspaceTreeToFileTree } from './file-tree-utils';

interface TestFile extends WorkspaceTreeFile {
  type: 'file';
}

interface TestFolder extends WorkspaceTreeFolder<TestItem> {
  type: 'folder';
}

type TestItem = TestFile | TestFolder;

function TestIcon() {
  return null;
}

const options = {
  folderFallbackName: 'Untitled folder',
  fileFallbackName: 'Untitled request',
  resolveFileIcon: () => TestIcon,
};

describe('workspace file tree utilities', () => {
  it('preserves pre-order structure, fallbacks, and folder metadata', () => {
    const tree: TestItem[] = [
      {
        id: 'root',
        name: 'Root',
        type: 'folder',
        children: [
          { id: 'request', name: null, type: 'file' },
          {
            id: 'nested',
            name: null,
            type: 'folder',
            parentId: 'root',
            children: [{ id: 'nested-request', name: 'Nested request', type: 'file' }],
          },
        ],
      },
    ];

    expect(mapWorkspaceTreeToFileTree(tree, options)).toEqual([
      {
        id: 'root',
        name: 'Root',
        type: 'folder',
        children: [
          { id: 'request', name: 'Untitled request', type: 'file', icon: TestIcon },
          {
            id: 'nested',
            name: 'Untitled folder',
            type: 'folder',
            children: [{ id: 'nested-request', name: 'Nested request', type: 'file', icon: TestIcon }],
          },
        ],
      },
    ]);
    expect(findFolderInWorkspaceTree(tree, 'nested')?.id).toBe('nested');
    expect(flattenWorkspaceFolders(tree)).toEqual([
      { id: 'root', name: 'Root', parentId: undefined },
      { id: 'nested', name: 'Untitled Folder', parentId: 'root' },
    ]);
  });

  it('handles deep trees and cyclic input without recursive stack growth', () => {
    const depth = 10_000;
    let item: TestItem = { id: 'leaf', name: 'Leaf', type: 'file' };

    for (let index = depth - 1; index >= 0; index -= 1) {
      item = {
        id: `folder-${index}`,
        name: `Folder ${index}`,
        type: 'folder',
        parentId: index === 0 ? null : `folder-${index - 1}`,
        children: [item],
      };
    }

    const tree = [item];
    const mapped = mapWorkspaceTreeToFileTree(tree, options);
    expect(findFolderInWorkspaceTree(tree, `folder-${depth - 1}`)?.id).toBe(`folder-${depth - 1}`);
    expect(flattenWorkspaceFolders(tree)).toHaveLength(depth);

    let mappedItem: FileTreeItem | undefined = mapped[0];
    for (let index = 0; index < depth; index += 1) {
      expect(mappedItem?.type).toBe('folder');
      mappedItem = mappedItem?.type === 'folder' ? mappedItem.children?.[0] : undefined;
    }
    expect(mappedItem?.id).toBe('leaf');

    const cyclicFolder: TestFolder = { id: 'cycle', name: 'Cycle', type: 'folder', children: [] };
    cyclicFolder.children = [cyclicFolder];
    const cyclicTree: TestItem[] = [cyclicFolder];
    expect(mapWorkspaceTreeToFileTree(cyclicTree, options)).toEqual([
      { id: 'cycle', name: 'Cycle', type: 'folder', children: [] },
    ]);
    expect(flattenWorkspaceFolders(cyclicTree)).toHaveLength(1);
  });
});
