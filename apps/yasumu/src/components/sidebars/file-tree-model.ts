import type { ComponentType } from 'react';

export type FileTreeItemType = 'file' | 'folder';

export interface FileTreeIconProps {
  short?: boolean;
}

export type FileTreeIcon = ComponentType<FileTreeIconProps>;

interface FileTreeItemBase {
  id: string;
  name: string;
  icon?: FileTreeIcon;
}

export interface FileTreeFileItem extends FileTreeItemBase {
  type: 'file';
  children?: never;
}

export interface FileTreeFolderItem extends FileTreeItemBase {
  type: 'folder';
  children?: FileTreeItem[];
}

export type FileTreeItem = FileTreeFileItem | FileTreeFolderItem;
export type FileTreeItemKey = `${FileTreeItemType}:${string}`;

export interface FileTreeRow {
  key: FileTreeItemKey;
  item: FileTreeItem;
  depth: number;
  parentKey: FileTreeItemKey | null;
  positionInSet: number;
  setSize: number;
}

export interface FileTreeIndex {
  rows: readonly FileTreeRow[];
  rootKeys: readonly FileTreeItemKey[];
  rowByKey: ReadonlyMap<FileTreeItemKey, FileTreeRow>;
  childrenByParentKey: ReadonlyMap<FileTreeItemKey, readonly FileTreeItemKey[]>;
}

export interface SearchableFileTreeItem {
  key: FileTreeItemKey;
  id: string;
  name: string;
  path: string;
  ancestorFolderIds: readonly string[];
  icon?: FileTreeIcon;
}

interface PendingRow {
  item: FileTreeItem;
  depth: number;
  parentKey: FileTreeItemKey | null;
  positionInSet: number;
  setSize: number;
}

export function getFileTreeItemKey(type: FileTreeItemType, id: string): FileTreeItemKey;
export function getFileTreeItemKey(item: Pick<FileTreeItem, 'id' | 'type'>): FileTreeItemKey;
export function getFileTreeItemKey(
  itemOrType: Pick<FileTreeItem, 'id' | 'type'> | FileTreeItemType,
  id?: string,
): FileTreeItemKey {
  if (typeof itemOrType === 'string') {
    return `${itemOrType}:${id ?? ''}`;
  }

  return `${itemOrType.type}:${itemOrType.id}`;
}

/**
 * Builds a stable, pre-order index without recursion so deeply nested workspaces
 * cannot overflow the JavaScript call stack.
 */
export function buildFileTreeIndex(items: readonly FileTreeItem[]): FileTreeIndex {
  const rows: FileTreeRow[] = [];
  const rowByKey = new Map<FileTreeItemKey, FileTreeRow>();
  const childrenByParentKey = new Map<FileTreeItemKey, FileTreeItemKey[]>();
  const rootKeys: FileTreeItemKey[] = [];
  const pending: PendingRow[] = [];

  pushChildrenInReverse(pending, items, null, 0);

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;

    const key = getFileTreeItemKey(current.item);

    // Duplicate identities cannot be rendered or addressed reliably. Keep the
    // first occurrence deterministic rather than emitting unstable React keys.
    if (rowByKey.has(key)) continue;

    const row: FileTreeRow = {
      key,
      item: current.item,
      depth: current.depth,
      parentKey: current.parentKey,
      positionInSet: current.positionInSet,
      setSize: current.setSize,
    };

    rows.push(row);
    rowByKey.set(key, row);

    if (row.parentKey) {
      const siblings = childrenByParentKey.get(row.parentKey) ?? [];
      siblings.push(key);
      childrenByParentKey.set(row.parentKey, siblings);
    } else {
      rootKeys.push(key);
    }

    if (current.item.type === 'folder') {
      const children = current.item.children ?? [];
      if (!childrenByParentKey.has(key)) childrenByParentKey.set(key, []);
      pushChildrenInReverse(pending, children, key, current.depth + 1);
    }
  }

  return {
    rows,
    rootKeys,
    rowByKey,
    childrenByParentKey,
  };
}

function pushChildrenInReverse(
  pending: PendingRow[],
  items: readonly FileTreeItem[],
  parentKey: FileTreeItemKey | null,
  depth: number,
) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (!item) continue;

    pending.push({
      item,
      depth,
      parentKey,
      positionInSet: index + 1,
      setSize: items.length,
    });
  }
}

export function collectFolderIds(index: FileTreeIndex): Set<string> {
  const folderIds = new Set<string>();

  for (const row of index.rows) {
    if (row.item.type === 'folder') folderIds.add(row.item.id);
  }

  return folderIds;
}

/** Returns the pre-order rows whose complete ancestor chain is expanded. */
export function getVisibleFileTreeRows(index: FileTreeIndex, expandedFolderIds: ReadonlySet<string>): FileTreeRow[] {
  const visibleRows: FileTreeRow[] = [];
  const pending = [...index.rootKeys].reverse();

  while (pending.length > 0) {
    const key = pending.pop();
    if (!key) break;

    const row = index.rowByKey.get(key);
    if (!row) continue;

    visibleRows.push(row);

    if (row.item.type !== 'folder' || !expandedFolderIds.has(row.item.id)) continue;

    const children = index.childrenByParentKey.get(key) ?? [];
    for (let childIndex = children.length - 1; childIndex >= 0; childIndex -= 1) {
      const childKey = children[childIndex];
      if (childKey) pending.push(childKey);
    }
  }

  return visibleRows;
}

export function getAncestorFolderIds(index: FileTreeIndex, key: FileTreeItemKey): string[] {
  const ancestorIds: string[] = [];
  const visited = new Set<FileTreeItemKey>();
  let parentKey = index.rowByKey.get(key)?.parentKey ?? null;

  while (parentKey && !visited.has(parentKey)) {
    visited.add(parentKey);
    const parent = index.rowByKey.get(parentKey);
    if (!parent) break;

    if (parent.item.type === 'folder') ancestorIds.push(parent.item.id);
    parentKey = parent.parentKey;
  }

  return ancestorIds.reverse();
}

/**
 * Resolves the destination used by toolbar and keyboard create actions from
 * the selected row. Files create beside themselves, folders create within
 * themselves, and an external folder selection is only a fallback when no
 * indexed row is selected.
 */
export function getFileTreeCreationParentId(
  index: FileTreeIndex,
  selectedKey: FileTreeItemKey | null,
  fallbackFolderId: string | null = null,
): string | null {
  if (!selectedKey) return fallbackFolderId;

  const selectedRow = index.rowByKey.get(selectedKey);
  if (!selectedRow) return fallbackFolderId;
  if (selectedRow.item.type === 'folder') return selectedRow.item.id;
  if (!selectedRow.parentKey) return null;

  const parentRow = index.rowByKey.get(selectedRow.parentKey);
  return parentRow?.item.type === 'folder' ? parentRow.item.id : null;
}

export function getSearchableFileTreeItems(index: FileTreeIndex): SearchableFileTreeItem[] {
  const searchableItems: SearchableFileTreeItem[] = [];

  for (const row of index.rows) {
    if (row.item.type !== 'file') continue;

    const pathSegments = [row.item.name];
    const ancestorFolderIds: string[] = [];
    const visited = new Set<FileTreeItemKey>();
    let parentKey = row.parentKey;

    while (parentKey && !visited.has(parentKey)) {
      visited.add(parentKey);
      const parent = index.rowByKey.get(parentKey);
      if (!parent) break;

      pathSegments.push(parent.item.name);
      if (parent.item.type === 'folder') ancestorFolderIds.push(parent.item.id);
      parentKey = parent.parentKey;
    }

    searchableItems.push({
      key: row.key,
      id: row.item.id,
      name: row.item.name,
      path: pathSegments.reverse().join('/'),
      ancestorFolderIds: ancestorFolderIds.reverse(),
      icon: row.item.icon,
    });
  }

  return searchableItems;
}

export function isFileTreeDescendant(
  index: FileTreeIndex,
  candidateKey: FileTreeItemKey,
  ancestorKey: FileTreeItemKey,
): boolean {
  const visited = new Set<FileTreeItemKey>();
  let parentKey = index.rowByKey.get(candidateKey)?.parentKey ?? null;

  while (parentKey && !visited.has(parentKey)) {
    if (parentKey === ancestorKey) return true;

    visited.add(parentKey);
    parentKey = index.rowByKey.get(parentKey)?.parentKey ?? null;
  }

  return false;
}

/**
 * Verifies that moving an item beneath a folder cannot create a parent cycle.
 * Copying is intentionally outside this helper because copying a snapshot into
 * one of its descendants does not re-parent the source node.
 */
export function canMoveFileTreeItem(
  index: FileTreeIndex,
  sourceType: FileTreeItemType,
  sourceId: string,
  targetFolderId: string | null,
): boolean {
  const sourceKey = getFileTreeItemKey(sourceType, sourceId);
  const source = index.rowByKey.get(sourceKey);
  if (!source) return false;

  if (targetFolderId === null) return true;

  const targetKey = getFileTreeItemKey('folder', targetFolderId);
  const target = index.rowByKey.get(targetKey);
  if (!target || target.item.type !== 'folder') return false;

  if (source.item.type === 'file') return true;
  if (sourceKey === targetKey) return false;

  return !isFileTreeDescendant(index, targetKey, sourceKey);
}

export function getNearestVisibleAncestor(
  index: FileTreeIndex,
  key: FileTreeItemKey,
  visibleKeys: ReadonlySet<FileTreeItemKey>,
): FileTreeRow | null {
  const visited = new Set<FileTreeItemKey>();
  let currentKey: FileTreeItemKey | null = key;

  while (currentKey && !visited.has(currentKey)) {
    visited.add(currentKey);
    const row = index.rowByKey.get(currentKey);
    if (!row) return null;
    if (visibleKeys.has(currentKey)) return row;
    currentKey = row.parentKey;
  }

  return null;
}
