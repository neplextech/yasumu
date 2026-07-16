'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@yasumu/ui/components/alert-dialog';
import { buttonVariants } from '@yasumu/ui/components/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@yasumu/ui/components/command';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@yasumu/ui/components/context-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarRail,
} from '@yasumu/ui/components/sidebar';
import { useCopyToClipboard } from '@yasumu/ui/hooks/use-copy-to-clipboard';
import { cn } from '@yasumu/ui/lib/utils';
import { ChevronRight, File, Folder, RefreshCw, Search } from 'lucide-react';
import * as React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { MdFolder } from 'react-icons/md';
import { VscCollapseAll } from 'react-icons/vsc';

import { usePlatform } from '@/hooks/use-platform';

import { CreateInputDialog } from '../dialogs/create-input-dialog';
import type { FileTreeItem, FileTreeItemKey, FileTreeRow, SearchableFileTreeItem } from './file-tree-model';
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
} from './file-tree-model';

export type { FileTreeIcon, FileTreeItem, FileTreeItemType } from './file-tree-model';

export type ClipboardOperation = 'copy' | 'cut';

export interface ClipboardItem {
  id: string;
  type: 'file' | 'folder';
  operation: ClipboardOperation;
}

export interface FileTreeSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /** Resets local explorer state when the owning workspace or scope changes. */
  stateKey?: string;
  fileTree: FileTreeItem[];
  onFileSelect?: (id: string) => void;
  onFileCreate?: (name: string, parentId?: string | null) => void;
  onFolderCreate?: (name: string, parentId?: string | null) => void;
  onFileDelete?: (id: string) => void;
  onFolderDelete?: (id: string) => void;
  onFileRename?: (id: string, name: string) => void;
  onFolderRename?: (id: string, name: string) => void;
  onFileDuplicate?: (id: string) => void;
  onFolderDuplicate?: (id: string) => void;
  onFileCopy?: (id: string) => void;
  onFolderCopy?: (id: string) => void;
  onFileCut?: (id: string) => void;
  onFolderCut?: (id: string) => void;
  onPasteItem?: (targetFolderId: string | null) => void;
  clipboard?: ClipboardItem | null;
  /** Active file supplied by the owning module; changes reveal it without re-running onFileSelect. */
  selectedFileId?: string | null;
  selectedFolderId?: string | null;
  onFolderSelect?: (id: string | null) => void;
  reloadTree?: () => void;
  additionalToolbarItems?: React.ReactNode;
  enableFileSearch?: boolean;
  fileSearchPlaceholder?: string;
}

type InputDialogState =
  | { kind: 'create-file'; parentId: string | null }
  | { kind: 'create-folder'; parentId: string | null }
  | { kind: 'rename'; row: FileTreeRow };

interface DeleteDialogState {
  key: FileTreeItemKey;
  id: string;
  name: string;
  type: 'file' | 'folder';
}

const TREE_ROW_HEIGHT = 36;
const TREE_OVERSCAN = 12;

function getExpandedFolderIds(rows: readonly FileTreeRow[], collapsedFolderIds: ReadonlySet<string>): Set<string> {
  const expandedFolderIds = new Set<string>();

  for (const row of rows) {
    if (row.item.type === 'folder' && !collapsedFolderIds.has(row.item.id)) {
      expandedFolderIds.add(row.item.id);
    }
  }

  return expandedFolderIds;
}

function hasSelectedText() {
  return typeof window !== 'undefined' && Boolean(window.getSelection()?.toString());
}

function ToolbarButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring flex size-6 items-center justify-center rounded-sm outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-3.5"
      {...props}
    >
      {children}
    </button>
  );
}

interface VirtualizedFileTreeRowProps {
  row: FileTreeRow;
  domId: string;
  isSelected: boolean;
  isCut: boolean;
  isExpanded: boolean;
  tabIndex: 0 | -1;
  onSelect: (row: FileTreeRow, activateFile: boolean) => void;
  onToggle: (row: FileTreeRow) => void;
}

const VirtualizedFileTreeRow = React.memo(function VirtualizedFileTreeRow({
  row,
  domId,
  isSelected,
  isCut,
  isExpanded,
  tabIndex,
  onSelect,
  onToggle,
}: VirtualizedFileTreeRowProps) {
  const { item } = row;
  const Icon = item.icon;
  const isFolder = item.type === 'folder';

  return (
    <SidebarMenuButton
      id={domId}
      type="button"
      size="sm"
      role="treeitem"
      aria-level={row.depth + 1}
      aria-posinset={row.positionInSet}
      aria-setsize={row.setSize}
      aria-selected={isSelected}
      aria-expanded={isFolder ? isExpanded : undefined}
      data-tree-item-key={row.key}
      tabIndex={tabIndex}
      isActive={isSelected}
      className={cn('h-8 min-w-0 gap-1.5 truncate text-xs', isCut && 'opacity-50')}
      style={{ paddingInlineStart: `${8 + row.depth * 16}px` }}
      onFocus={() => onSelect(row, false)}
      onClick={() => {
        onSelect(row, item.type === 'file');
        if (isFolder) onToggle(row);
      }}
    >
      {isFolder ? (
        <>
          <ChevronRight
            aria-hidden="true"
            className={cn('transition-transform motion-reduce:transition-none', isExpanded && 'rotate-90')}
          />
          <MdFolder aria-hidden="true" />
        </>
      ) : (
        <>{Icon ? <Icon short /> : <File aria-hidden="true" />}</>
      )}
      <span className="truncate">{item.name}</span>
    </SidebarMenuButton>
  );
});

export function FileTreeSidebar({ stateKey = 'default', ...props }: FileTreeSidebarProps) {
  return <FileTreeSidebarController key={stateKey} {...props} />;
}

function FileTreeSidebarController({
  fileTree,
  onFileCreate,
  onFolderCreate,
  onFileDelete,
  onFolderDelete,
  onFileRename,
  onFolderRename,
  onFileSelect,
  onFileDuplicate,
  onFolderDuplicate,
  onFileCopy,
  onFolderCopy,
  onFileCut,
  onFolderCut,
  onPasteItem,
  clipboard,
  selectedFileId,
  selectedFolderId,
  onFolderSelect,
  reloadTree,
  additionalToolbarItems,
  enableFileSearch = false,
  fileSearchPlaceholder = 'Search files...',
  ...props
}: Omit<FileTreeSidebarProps, 'stateKey'>) {
  const treeIndex = React.useMemo(() => buildFileTreeIndex(fileTree), [fileTree]);
  const [collapsedFolderIds, setCollapsedFolderIds] = React.useState<Set<string>>(() => new Set());
  const normalizedSelectedFileId = selectedFileId ?? null;
  const externalSelectedKey = normalizedSelectedFileId ? getFileTreeItemKey('file', normalizedSelectedFileId) : null;
  const externalSelectionAncestorIds = externalSelectedKey ? getAncestorFolderIds(treeIndex, externalSelectedKey) : [];
  const externalSelectionToken = externalSelectedKey
    ? `${externalSelectedKey}:${externalSelectionAncestorIds.join('/') || 'root'}`
    : 'none';
  const [observedExternalSelectionToken, setObservedExternalSelectionToken] = React.useState(externalSelectionToken);
  const [selectedKey, setSelectedKey] = React.useState<FileTreeItemKey | null>(externalSelectedKey);
  const [contextTargetKey, setContextTargetKey] = React.useState<FileTreeItemKey | null>(null);
  const [inputDialog, setInputDialog] = React.useState<InputDialogState | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<DeleteDialogState | null>(null);
  const [fileSearchOpen, setFileSearchOpen] = React.useState(false);
  const scrollElementRef = React.useRef<HTMLDivElement>(null);
  const treeDomId = React.useId();
  const copyToClipboard = useCopyToClipboard();
  const { isMac } = usePlatform();

  if (observedExternalSelectionToken !== externalSelectionToken) {
    setObservedExternalSelectionToken(externalSelectionToken);
    setSelectedKey(externalSelectedKey);

    if (externalSelectionAncestorIds.some((folderId) => collapsedFolderIds.has(folderId))) {
      const nextCollapsedFolderIds = new Set(collapsedFolderIds);
      for (const folderId of externalSelectionAncestorIds) nextCollapsedFolderIds.delete(folderId);
      setCollapsedFolderIds(nextCollapsedFolderIds);
    }
  }

  const expandedFolderIds = React.useMemo(
    () => getExpandedFolderIds(treeIndex.rows, collapsedFolderIds),
    [collapsedFolderIds, treeIndex.rows],
  );
  const visibleRows = React.useMemo(
    () => getVisibleFileTreeRows(treeIndex, expandedFolderIds),
    [expandedFolderIds, treeIndex],
  );
  const visibleIndexByKey = React.useMemo(
    () => new Map(visibleRows.map((row, index) => [row.key, index] as const)),
    [visibleRows],
  );
  const searchableFiles = React.useMemo(() => getSearchableFileTreeItems(treeIndex), [treeIndex]);
  const selectedRow = selectedKey ? (treeIndex.rowByKey.get(selectedKey) ?? null) : null;
  const tabStopKey = selectedKey && visibleIndexByKey.has(selectedKey) ? selectedKey : (visibleRows[0]?.key ?? null);

  const rowVirtualizer = useVirtualizer({
    count: visibleRows.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => TREE_ROW_HEIGHT,
    getItemKey: (index) => visibleRows[index]?.key ?? `missing:${index}`,
    overscan: TREE_OVERSCAN,
    useFlushSync: false,
  });
  const lastRevealedExternalSelectionRef = React.useRef<string | null>(null);
  const externalSelectedRowIndex = externalSelectedKey ? visibleIndexByKey.get(externalSelectedKey) : undefined;

  React.useEffect(() => {
    if (externalSelectedRowIndex === undefined || lastRevealedExternalSelectionRef.current === externalSelectionToken) {
      return;
    }

    lastRevealedExternalSelectionRef.current = externalSelectionToken;
    rowVirtualizer.scrollToIndex(externalSelectedRowIndex, { align: 'auto' });
  }, [externalSelectedRowIndex, externalSelectionToken, rowVirtualizer]);

  const getRowDomId = React.useCallback(
    (key: FileTreeItemKey) => `${treeDomId}-file-tree-${encodeURIComponent(key)}`,
    [treeDomId],
  );

  const clearSelection = React.useCallback(() => {
    setSelectedKey(null);
    onFolderSelect?.(null);
  }, [onFolderSelect]);

  const selectRow = React.useCallback(
    (row: FileTreeRow, activateFile: boolean) => {
      setSelectedKey(row.key);

      if (row.item.type === 'folder') {
        onFolderSelect?.(row.item.id);
        return;
      }

      onFolderSelect?.(null);
      if (activateFile) onFileSelect?.(row.item.id);
    },
    [onFileSelect, onFolderSelect],
  );

  const focusVisibleRow = React.useCallback(
    (rowIndex: number, align: 'auto' | 'center' = 'auto') => {
      const row = visibleRows[rowIndex];
      if (!row) return;

      selectRow(row, false);
      rowVirtualizer.scrollToIndex(rowIndex, { align });
      window.requestAnimationFrame(() => {
        document.getElementById(getRowDomId(row.key))?.focus({ preventScroll: true });
      });
    },
    [getRowDomId, rowVirtualizer, selectRow, visibleRows],
  );

  const toggleFolder = React.useCallback(
    (row: FileTreeRow) => {
      if (row.item.type !== 'folder') return;

      const isExpanded = expandedFolderIds.has(row.item.id);
      const nextCollapsedFolderIds = new Set(collapsedFolderIds);

      if (isExpanded) nextCollapsedFolderIds.add(row.item.id);
      else nextCollapsedFolderIds.delete(row.item.id);

      setCollapsedFolderIds(nextCollapsedFolderIds);

      if (!isExpanded || !selectedKey) return;

      const nextExpandedFolderIds = getExpandedFolderIds(treeIndex.rows, nextCollapsedFolderIds);
      const nextVisibleRows = getVisibleFileTreeRows(treeIndex, nextExpandedFolderIds);
      const nearestRow = getNearestVisibleAncestor(
        treeIndex,
        selectedKey,
        new Set(nextVisibleRows.map((visibleRow) => visibleRow.key)),
      );

      if (nearestRow && nearestRow.key !== selectedKey) selectRow(nearestRow, false);
    },
    [collapsedFolderIds, expandedFolderIds, selectRow, selectedKey, treeIndex],
  );

  const collapseAll = React.useCallback(() => {
    setCollapsedFolderIds(collectFolderIds(treeIndex));

    if (!selectedKey) return;

    const rootRows = getVisibleFileTreeRows(treeIndex, new Set());
    const nearestRow = getNearestVisibleAncestor(treeIndex, selectedKey, new Set(rootRows.map((row) => row.key)));

    if (nearestRow && nearestRow.key !== selectedKey) selectRow(nearestRow, false);
  }, [selectRow, selectedKey, treeIndex]);

  const deleteRow = React.useCallback(
    (target: Pick<DeleteDialogState, 'id' | 'type' | 'key'>) => {
      if (target.type === 'file') onFileDelete?.(target.id);
      else onFolderDelete?.(target.id);

      if (selectedKey === target.key) clearSelection();
    },
    [clearSelection, onFileDelete, onFolderDelete, selectedKey],
  );

  const requestDelete = React.useCallback(
    (row: FileTreeRow) => {
      const canDelete = row.item.type === 'file' ? Boolean(onFileDelete) : Boolean(onFolderDelete);
      if (!canDelete) return;

      setDeleteDialog({
        key: row.key,
        id: row.item.id,
        name: row.item.name,
        type: row.item.type,
      });
    },
    [onFileDelete, onFolderDelete],
  );

  const copyRow = React.useCallback(
    (row: FileTreeRow) => {
      if (row.item.type === 'file') onFileCopy?.(row.item.id);
      else onFolderCopy?.(row.item.id);
    },
    [onFileCopy, onFolderCopy],
  );

  const cutRow = React.useCallback(
    (row: FileTreeRow) => {
      if (row.item.type === 'file') onFileCut?.(row.item.id);
      else onFolderCut?.(row.item.id);
    },
    [onFileCut, onFolderCut],
  );

  const duplicateRow = React.useCallback(
    (row: FileTreeRow) => {
      if (row.item.type === 'file') onFileDuplicate?.(row.item.id);
      else onFolderDuplicate?.(row.item.id);
    },
    [onFileDuplicate, onFolderDuplicate],
  );

  const canPasteInto = React.useCallback(
    (targetFolderId: string | null) => {
      if (!clipboard || !onPasteItem) return false;

      const sourceKey = getFileTreeItemKey(clipboard.type, clipboard.id);
      if (!treeIndex.rowByKey.has(sourceKey)) return false;

      return (
        clipboard.operation === 'copy' || canMoveFileTreeItem(treeIndex, clipboard.type, clipboard.id, targetFolderId)
      );
    },
    [clipboard, onPasteItem, treeIndex],
  );

  const pasteInto = React.useCallback(
    (targetFolderId: string | null) => {
      if (canPasteInto(targetFolderId)) onPasteItem?.(targetFolderId);
    },
    [canPasteInto, onPasteItem],
  );

  const creationParentId = getFileTreeCreationParentId(treeIndex, selectedKey, selectedFolderId ?? null);
  const selectedCanDelete = selectedRow
    ? selectedRow.item.type === 'file'
      ? Boolean(onFileDelete)
      : Boolean(onFolderDelete)
    : false;
  const selectedCanRename = selectedRow
    ? selectedRow.item.type === 'file'
      ? Boolean(onFileRename)
      : Boolean(onFolderRename)
    : false;

  useHotkeys(
    'mod+n',
    () => setInputDialog({ kind: 'create-file', parentId: creationParentId }),
    { enabled: Boolean(onFileCreate), preventDefault: true, enableOnFormTags: false },
    [creationParentId, onFileCreate],
  );
  useHotkeys(
    'mod+f',
    () => setFileSearchOpen(true),
    { enabled: enableFileSearch, preventDefault: true, enableOnFormTags: false },
    [enableFileSearch],
  );
  useHotkeys(
    'delete',
    (event) => {
      if (!event.shiftKey && selectedRow) requestDelete(selectedRow);
    },
    { enabled: selectedCanDelete, preventDefault: true, enableOnFormTags: false },
    [requestDelete, selectedCanDelete, selectedRow],
  );
  useHotkeys(
    'shift+delete',
    () => {
      if (!selectedRow) return;
      deleteRow({ ...selectedRow.item, key: selectedRow.key });
    },
    { enabled: selectedCanDelete, preventDefault: true, enableOnFormTags: false },
    [deleteRow, selectedCanDelete, selectedRow],
  );
  useHotkeys(
    'mod+c',
    (event) => {
      if (!selectedRow || hasSelectedText()) return;
      const canCopy = selectedRow.item.type === 'file' ? Boolean(onFileCopy) : Boolean(onFolderCopy);
      if (!canCopy) return;
      event.preventDefault();
      copyRow(selectedRow);
    },
    { preventDefault: false, enableOnFormTags: false },
    [copyRow, onFileCopy, onFolderCopy, selectedRow],
  );
  useHotkeys(
    'mod+x',
    (event) => {
      if (!selectedRow || hasSelectedText()) return;
      const canCut = selectedRow.item.type === 'file' ? Boolean(onFileCut) : Boolean(onFolderCut);
      if (!canCut) return;
      event.preventDefault();
      cutRow(selectedRow);
    },
    { preventDefault: false, enableOnFormTags: false },
    [cutRow, onFileCut, onFolderCut, selectedRow],
  );
  useHotkeys(
    'mod+v',
    (event) => {
      const targetFolderId = selectedRow?.item.type === 'folder' ? selectedRow.item.id : null;
      if (!canPasteInto(targetFolderId)) return;
      event.preventDefault();
      pasteInto(targetFolderId);
    },
    { preventDefault: false, enableOnFormTags: false },
    [canPasteInto, pasteInto, selectedRow],
  );
  useHotkeys(
    'mod+d',
    (event) => {
      if (!selectedRow) return;
      const canDuplicate = selectedRow.item.type === 'file' ? Boolean(onFileDuplicate) : Boolean(onFolderDuplicate);
      if (!canDuplicate) return;
      event.preventDefault();
      duplicateRow(selectedRow);
    },
    { preventDefault: false, enableOnFormTags: false },
    [duplicateRow, onFileDuplicate, onFolderDuplicate, selectedRow],
  );
  useHotkeys(
    'f2',
    () => {
      if (selectedRow) setInputDialog({ kind: 'rename', row: selectedRow });
    },
    { enabled: selectedCanRename, preventDefault: true, enableOnFormTags: false },
    [selectedCanRename, selectedRow],
  );

  const handleTreeKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const target =
        event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-tree-item-key]') : null;
      const key = target?.dataset.treeItemKey as FileTreeItemKey | undefined;
      const currentIndex = key ? visibleIndexByKey.get(key) : undefined;
      if (currentIndex === undefined) return;

      const row = visibleRows[currentIndex];
      if (!row) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusVisibleRow(Math.min(currentIndex + 1, visibleRows.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusVisibleRow(Math.max(currentIndex - 1, 0));
          break;
        case 'Home':
          event.preventDefault();
          focusVisibleRow(0);
          break;
        case 'End':
          event.preventDefault();
          focusVisibleRow(visibleRows.length - 1);
          break;
        case 'ArrowRight': {
          if (row.item.type !== 'folder') return;
          event.preventDefault();
          if (!expandedFolderIds.has(row.item.id)) {
            toggleFolder(row);
          } else if (visibleRows[currentIndex + 1]?.parentKey === row.key) {
            focusVisibleRow(currentIndex + 1);
          }
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          if (row.item.type === 'folder' && expandedFolderIds.has(row.item.id)) {
            toggleFolder(row);
            break;
          }

          const parentIndex = row.parentKey ? visibleIndexByKey.get(row.parentKey) : undefined;
          if (parentIndex !== undefined) focusVisibleRow(parentIndex);
          break;
        }
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (row.item.type === 'folder') toggleFolder(row);
          else selectRow(row, true);
          break;
      }
    },
    [expandedFolderIds, focusVisibleRow, selectRow, toggleFolder, visibleIndexByKey, visibleRows],
  );

  const revealSearchResult = React.useCallback(
    (item: SearchableFileTreeItem) => {
      const row = treeIndex.rowByKey.get(item.key);
      if (!row) return;

      const nextCollapsedFolderIds = new Set(collapsedFolderIds);
      for (const ancestorId of item.ancestorFolderIds) nextCollapsedFolderIds.delete(ancestorId);

      const nextExpandedFolderIds = getExpandedFolderIds(treeIndex.rows, nextCollapsedFolderIds);
      const nextVisibleRows = getVisibleFileTreeRows(treeIndex, nextExpandedFolderIds);
      const nextIndex = nextVisibleRows.findIndex((nextRow) => nextRow.key === item.key);

      setCollapsedFolderIds(nextCollapsedFolderIds);
      selectRow(row, true);
      setFileSearchOpen(false);

      if (nextIndex < 0) return;
      window.requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(nextIndex, { align: 'center' });
        window.requestAnimationFrame(() => {
          document.getElementById(getRowDomId(item.key))?.focus({ preventScroll: true });
        });
      });
    },
    [collapsedFolderIds, getRowDomId, rowVirtualizer, selectRow, treeIndex],
  );

  const handleInputSubmit = React.useCallback(
    (name: string) => {
      if (!inputDialog) return;

      if (inputDialog.kind === 'create-file') onFileCreate?.(name, inputDialog.parentId);
      else if (inputDialog.kind === 'create-folder') onFolderCreate?.(name, inputDialog.parentId);
      else if (inputDialog.row.item.type === 'file') onFileRename?.(inputDialog.row.item.id, name);
      else onFolderRename?.(inputDialog.row.item.id, name);

      setInputDialog(null);
    },
    [inputDialog, onFileCreate, onFileRename, onFolderCreate, onFolderRename],
  );

  const contextRow = contextTargetKey ? (treeIndex.rowByKey.get(contextTargetKey) ?? null) : null;
  const contextIsRoot = contextRow === null;
  const contextIsFolder = contextRow?.item.type === 'folder';
  const contextFolderId = contextIsFolder ? contextRow.item.id : null;
  const contextCanCopy = contextRow
    ? contextRow.item.type === 'file'
      ? Boolean(onFileCopy)
      : Boolean(onFolderCopy)
    : false;
  const contextCanCut = contextRow
    ? contextRow.item.type === 'file'
      ? Boolean(onFileCut)
      : Boolean(onFolderCut)
    : false;
  const contextCanDuplicate = contextRow
    ? contextRow.item.type === 'file'
      ? Boolean(onFileDuplicate)
      : Boolean(onFolderDuplicate)
    : false;
  const contextCanRename = contextRow
    ? contextRow.item.type === 'file'
      ? Boolean(onFileRename)
      : Boolean(onFolderRename)
    : false;
  const contextCanDelete = contextRow
    ? contextRow.item.type === 'file'
      ? Boolean(onFileDelete)
      : Boolean(onFolderDelete)
    : false;
  const contextHasCreateActions =
    (contextIsRoot || contextIsFolder) && (Boolean(onFileCreate) || Boolean(onFolderCreate));
  const contextHasClipboardActions =
    contextCanCopy ||
    contextCanCut ||
    contextCanDuplicate ||
    ((contextIsRoot || contextIsFolder) && Boolean(onPasteItem));
  const modKey = isMac ? '⌘' : 'Ctrl+';

  const inputDialogTitle =
    inputDialog?.kind === 'rename'
      ? `Rename ${inputDialog.row.item.type}`
      : inputDialog?.kind === 'create-folder'
        ? 'Add new folder'
        : 'Add new file';
  const inputDialogDescription =
    inputDialog?.kind === 'rename'
      ? 'Enter the new name'
      : inputDialog?.kind === 'create-folder'
        ? 'This will add a new folder'
        : 'This will add a new file';

  return (
    <Sidebar {...props}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarContent
            className="h-full overflow-hidden select-none"
            onContextMenuCapture={(event) => {
              const target =
                event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-tree-item-key]') : null;
              const key = target?.dataset.treeItemKey as FileTreeItemKey | undefined;
              const row = key ? treeIndex.rowByKey.get(key) : undefined;

              if (row) {
                setContextTargetKey(row.key);
                selectRow(row, false);
              } else {
                setContextTargetKey(null);
                clearSelection();
              }
            }}
          >
            <SidebarGroup className="h-full min-h-0 flex-1">
              <SidebarGroupLabel>
                <div className="flex w-full items-center justify-between gap-2">
                  <span>Explorer</span>
                  <div className="flex items-center gap-0.5">
                    {onFolderCreate ? (
                      <ToolbarButton
                        label="Add new folder"
                        onClick={() => setInputDialog({ kind: 'create-folder', parentId: creationParentId })}
                      >
                        <Folder />
                      </ToolbarButton>
                    ) : null}
                    {onFileCreate ? (
                      <ToolbarButton
                        label={`Add new file (${modKey}N)`}
                        onClick={() => setInputDialog({ kind: 'create-file', parentId: creationParentId })}
                      >
                        <File />
                      </ToolbarButton>
                    ) : null}
                    {enableFileSearch ? (
                      <ToolbarButton label={`Search files (${modKey}F)`} onClick={() => setFileSearchOpen(true)}>
                        <Search />
                      </ToolbarButton>
                    ) : null}
                    {additionalToolbarItems}
                    {reloadTree ? (
                      <ToolbarButton label="Reload explorer" onClick={reloadTree}>
                        <RefreshCw />
                      </ToolbarButton>
                    ) : null}
                    <ToolbarButton
                      label="Collapse all folders"
                      onClick={collapseAll}
                      disabled={treeIndex.rows.length === 0}
                    >
                      <VscCollapseAll />
                    </ToolbarButton>
                  </div>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent className="min-h-0 flex-1">
                <div
                  ref={scrollElementRef}
                  role="tree"
                  aria-label="Explorer files"
                  aria-multiselectable="false"
                  className="h-full overflow-auto overscroll-contain"
                  onKeyDown={handleTreeKeyDown}
                  onClick={(event) => {
                    if (
                      event.target instanceof HTMLElement &&
                      !event.target.closest<HTMLElement>('[data-tree-item-key]')
                    ) {
                      clearSelection();
                    }
                  }}
                >
                  {visibleRows.length === 0 ? (
                    <div role="status" className="text-muted-foreground px-2 py-4 text-center text-xs">
                      No files yet
                    </div>
                  ) : (
                    <div
                      role="presentation"
                      className="relative w-full"
                      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const row = visibleRows[virtualRow.index];
                        if (!row) return null;

                        const isExpanded = row.item.type === 'folder' && expandedFolderIds.has(row.item.id);
                        const isCut =
                          clipboard?.operation === 'cut' &&
                          clipboard.type === row.item.type &&
                          clipboard.id === row.item.id;

                        return (
                          <div
                            key={row.key}
                            role="presentation"
                            className="absolute top-0 left-0 w-full py-0.5"
                            style={{
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <VirtualizedFileTreeRow
                              row={row}
                              domId={getRowDomId(row.key)}
                              isSelected={selectedKey === row.key}
                              isCut={isCut}
                              isExpanded={isExpanded}
                              tabIndex={tabStopKey === row.key ? 0 : -1}
                              onSelect={selectRow}
                              onToggle={toggleFolder}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-52">
          {contextHasCreateActions ? (
            <>
              {onFileCreate ? (
                <ContextMenuItem
                  inset
                  onSelect={() => setInputDialog({ kind: 'create-file', parentId: contextFolderId })}
                >
                  New File
                  <ContextMenuShortcut>{modKey}N</ContextMenuShortcut>
                </ContextMenuItem>
              ) : null}
              {onFolderCreate ? (
                <ContextMenuItem
                  inset
                  onSelect={() => setInputDialog({ kind: 'create-folder', parentId: contextFolderId })}
                >
                  New Folder
                </ContextMenuItem>
              ) : null}
              {contextHasClipboardActions ? <ContextMenuSeparator /> : null}
            </>
          ) : null}

          {contextRow && contextCanCut ? (
            <ContextMenuItem inset onSelect={() => cutRow(contextRow)}>
              Cut
              <ContextMenuShortcut>{modKey}X</ContextMenuShortcut>
            </ContextMenuItem>
          ) : null}
          {contextRow && contextCanCopy ? (
            <ContextMenuItem inset onSelect={() => copyRow(contextRow)}>
              Copy
              <ContextMenuShortcut>{modKey}C</ContextMenuShortcut>
            </ContextMenuItem>
          ) : null}
          {(contextIsRoot || contextIsFolder) && onPasteItem ? (
            <ContextMenuItem
              inset
              disabled={!canPasteInto(contextFolderId)}
              onSelect={() => pasteInto(contextFolderId)}
            >
              Paste
              <ContextMenuShortcut>{modKey}V</ContextMenuShortcut>
            </ContextMenuItem>
          ) : null}
          {contextRow && contextCanDuplicate ? (
            <ContextMenuItem inset onSelect={() => duplicateRow(contextRow)}>
              Duplicate
              <ContextMenuShortcut>{modKey}D</ContextMenuShortcut>
            </ContextMenuItem>
          ) : null}

          {contextRow && contextHasClipboardActions ? <ContextMenuSeparator /> : null}

          {contextRow ? (
            <ContextMenuItem inset onSelect={() => copyToClipboard(contextRow.item.id)}>
              Copy ID
            </ContextMenuItem>
          ) : null}
          {contextRow && contextCanRename ? (
            <ContextMenuItem inset onSelect={() => setInputDialog({ kind: 'rename', row: contextRow })}>
              Rename
              <ContextMenuShortcut>F2</ContextMenuShortcut>
            </ContextMenuItem>
          ) : null}
          {contextRow && contextCanDelete ? (
            <ContextMenuItem inset variant="destructive" onSelect={() => requestDelete(contextRow)}>
              Delete
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          ) : null}

          {!contextHasCreateActions && !contextHasClipboardActions && !contextRow ? (
            <ContextMenuItem disabled>No actions available</ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>

      <SidebarRail />

      <AlertDialog open={deleteDialog !== null} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialog?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => {
                if (deleteDialog) deleteRow(deleteDialog);
                setDeleteDialog(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateInputDialog
        key={
          inputDialog?.kind === 'rename'
            ? `${inputDialog.kind}:${inputDialog.row.key}`
            : `${inputDialog?.kind ?? 'closed'}:${inputDialog && 'parentId' in inputDialog ? inputDialog.parentId : ''}`
        }
        title={inputDialogTitle}
        description={inputDialogDescription}
        defaultValue={inputDialog?.kind === 'rename' ? inputDialog.row.item.name : undefined}
        submitLabel={inputDialog?.kind === 'rename' ? 'Rename' : 'Create'}
        onSubmit={handleInputSubmit}
        open={inputDialog !== null}
        onOpenChange={(open) => !open && setInputDialog(null)}
      />

      {enableFileSearch ? (
        <CommandDialog
          open={fileSearchOpen}
          onOpenChange={setFileSearchOpen}
          title="Search files"
          description="Search workspace files in this module"
        >
          <CommandInput placeholder={fileSearchPlaceholder} />
          <CommandList>
            <CommandEmpty>No files found.</CommandEmpty>
            <CommandGroup heading="Files">
              {searchableFiles.map((item) => {
                const Icon = item.icon;

                return (
                  <CommandItem
                    key={item.key}
                    value={`${item.path} ${item.name}`}
                    onSelect={() => revealSearchResult(item)}
                  >
                    {Icon ? <Icon short /> : <File aria-hidden="true" />}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{item.name}</span>
                      <span className="text-muted-foreground truncate text-xs">{item.path}</span>
                    </div>
                    <CommandShortcut>{modKey}F</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      ) : null}
    </Sidebar>
  );
}
