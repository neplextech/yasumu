import type { FileTreeIcon, FileTreeItem } from '@/components/sidebars/file-tree';

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

export type WorkspaceTreeItem<TItem> = WorkspaceTreeFolder<TItem> | WorkspaceTreeFile;

export function mapWorkspaceTreeToFileTree<TItem extends WorkspaceTreeItem<TItem>>(
  items: TItem[],
  options: {
    folderFallbackName: string;
    fileFallbackName: string;
    resolveFileIcon: (item: Extract<TItem, { type: 'file' }>) => FileTreeIcon;
  },
): FileTreeItem[] {
  const result: FileTreeItem[] = [];
  const visitedKeys = new Set<string>();
  const stack: Array<{ source: TItem[]; target: FileTreeItem[]; index: number }> = [
    { source: items, target: result, index: 0 },
  ];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.source.length) {
      stack.pop();
      continue;
    }

    const item = frame.source[frame.index];
    frame.index += 1;
    const itemKey = `${item.type}:${item.id}`;
    if (visitedKeys.has(itemKey)) continue;
    visitedKeys.add(itemKey);

    if (item.type === 'folder') {
      const children: FileTreeItem[] = [];
      frame.target.push({
        id: item.id,
        name: item.name ?? options.folderFallbackName,
        type: 'folder',
        children,
      });
      if (item.children?.length) stack.push({ source: item.children, target: children, index: 0 });
      continue;
    }

    frame.target.push({
      id: item.id,
      name: item.name ?? options.fileFallbackName,
      type: 'file',
      icon: options.resolveFileIcon(item as Extract<TItem, { type: 'file' }>),
    });
  }

  return result;
}

export function findFolderInWorkspaceTree<TItem extends WorkspaceTreeItem<TItem>>(
  items: TItem[],
  folderId: string,
): Extract<TItem, { type: 'folder' }> | null {
  const stack = [...items].reverse();
  const visitedKeys = new Set<string>();

  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    const itemKey = `${item.type}:${item.id}`;
    if (visitedKeys.has(itemKey)) continue;
    visitedKeys.add(itemKey);

    if (item.type === 'folder') {
      if (item.id === folderId) return item as Extract<TItem, { type: 'folder' }>;
      if (item.children) {
        for (let index = item.children.length - 1; index >= 0; index -= 1) stack.push(item.children[index]);
      }
    }
  }

  return null;
}

export function flattenWorkspaceFolders<TItem extends WorkspaceTreeItem<TItem>>(
  items: TItem[],
): { id: string; name: string; parentId?: string | null }[] {
  const folders: { id: string; name: string; parentId?: string | null }[] = [];
  const stack = [...items].reverse();
  const visitedKeys = new Set<string>();

  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    const itemKey = `${item.type}:${item.id}`;
    if (visitedKeys.has(itemKey)) continue;
    visitedKeys.add(itemKey);
    if (item.type !== 'folder') continue;

    folders.push({
      id: item.id,
      name: item.name ?? 'Untitled Folder',
      parentId: item.parentId,
    });
    if (item.children) {
      for (let index = item.children.length - 1; index >= 0; index -= 1) stack.push(item.children[index]);
    }
  }

  return folders;
}
