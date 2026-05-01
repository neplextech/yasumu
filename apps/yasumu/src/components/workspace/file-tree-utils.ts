import type { ComponentType } from 'react';
import type { FileTreeItem } from '@/components/sidebars/file-tree';

export interface WorkspaceTreeFolder<TItem> {
  id: string;
  name: string | null;
  type: 'folder';
  parentId?: string | null;
  children?: TItem[];
}

export interface WorkspaceTreeFile {
  id: string;
  name: string | null;
  type: 'file';
}

export type WorkspaceTreeItem<TItem> =
  | WorkspaceTreeFolder<TItem>
  | WorkspaceTreeFile;

export function mapWorkspaceTreeToFileTree<
  TItem extends WorkspaceTreeItem<TItem>,
>(
  items: TItem[],
  options: {
    folderFallbackName: string;
    fileFallbackName: string;
    resolveFileIcon: (item: Extract<TItem, { type: 'file' }>) => ComponentType;
  },
): FileTreeItem[] {
  return items.map((item): FileTreeItem => {
    if (item.type === 'folder') {
      return {
        id: item.id,
        name: item.name ?? options.folderFallbackName,
        type: 'folder',
        children: mapWorkspaceTreeToFileTree(item.children ?? [], options),
      };
    }

    return {
      id: item.id,
      name: item.name ?? options.fileFallbackName,
      type: 'file',
      icon: options.resolveFileIcon(item as Extract<TItem, { type: 'file' }>),
    };
  });
}

export function findFolderInWorkspaceTree<
  TItem extends WorkspaceTreeItem<TItem>,
>(items: TItem[], folderId: string): Extract<TItem, { type: 'folder' }> | null {
  for (const item of items) {
    if (item.type === 'folder') {
      if (item.id === folderId)
        return item as Extract<TItem, { type: 'folder' }>;

      const found = findFolderInWorkspaceTree(item.children ?? [], folderId);
      if (found) return found;
    }
  }

  return null;
}

export function flattenWorkspaceFolders<TItem extends WorkspaceTreeItem<TItem>>(
  items: TItem[],
): { id: string; name: string; parentId?: string | null }[] {
  const folders: { id: string; name: string; parentId?: string | null }[] = [];

  for (const item of items) {
    if (item.type !== 'folder') continue;

    folders.push({
      id: item.id,
      name: item.name ?? 'Untitled Folder',
      parentId: item.parentId,
    });
    folders.push(...flattenWorkspaceFolders(item.children ?? []));
  }

  return folders;
}
