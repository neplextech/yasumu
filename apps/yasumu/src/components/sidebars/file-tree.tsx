import { ChevronRight, File, Folder } from 'lucide-react';
import * as React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@yasumu/ui/components/collapsible';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@yasumu/ui/components/context-menu';
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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from '@yasumu/ui/components/sidebar';
import { MdFolder } from 'react-icons/md';
import { CreateInputDialog } from '../dialogs/create-input-dialog';
import { cn } from '@yasumu/ui/lib/utils';
import { usePlatform } from '@/hooks/use-platform';
import { useCopyToClipboard } from '@yasumu/ui/hooks/use-copy-to-clipboard';

export type ClipboardOperation = 'copy' | 'cut';

export interface ClipboardItem {
  id: string;
  type: 'file' | 'folder';
  operation: ClipboardOperation;
}

export interface FileTreeItem {
  id: string;
  name: string;
  icon?: React.ComponentType;
  children?: FileTreeItem[];
  type: 'folder' | 'file';
}

export interface FileTreeSidebarProps
  extends React.ComponentProps<typeof Sidebar> {
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
  selectedFolderId?: string | null;
  onFolderSelect?: (id: string | null) => void;
}

export function FileTreeSidebar({
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
  selectedFolderId,
  onFolderSelect,
  ...props
}: FileTreeSidebarProps) {
  const tree = Array.isArray(fileTree) ? fileTree : [fileTree];
  const [selectedItem, setSelectedItem] = React.useState<{
    id: string;
    type: 'file' | 'folder';
    name: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [newFileDialogOpen, setNewFileDialogOpen] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const { isMac } = usePlatform();

  const handleItemSelect = React.useCallback(
    (id: string, type: 'file' | 'folder', name: string) => {
      setSelectedItem({ id, type, name });
      if (type === 'folder') {
        onFolderSelect?.(id);
      }
    },
    [onFolderSelect],
  );

  const handleDelete = React.useCallback(
    (skipConfirmation: boolean) => {
      if (!selectedItem) return;
      if (skipConfirmation) {
        if (selectedItem.type === 'file') {
          onFileDelete?.(selectedItem.id);
        } else {
          onFolderDelete?.(selectedItem.id);
        }
        setSelectedItem(null);
      } else {
        setDeleteDialogOpen(true);
      }
    },
    [selectedItem, onFileDelete, onFolderDelete],
  );

  useHotkeys(
    'mod+n',
    () => {
      setNewFileDialogOpen(true);
    },
    { preventDefault: true, enableOnFormTags: false },
    [selectedFolderId],
  );

  useHotkeys(
    'delete',
    () => {
      if (selectedItem) {
        handleDelete(false);
      }
    },
    { preventDefault: true, enableOnFormTags: false },
    [selectedItem, handleDelete],
  );

  useHotkeys(
    'shift+delete',
    () => {
      if (selectedItem) {
        handleDelete(true);
      }
    },
    { preventDefault: true, enableOnFormTags: false },
    [selectedItem, handleDelete],
  );

  const [rootMenuOpen, setRootMenuOpen] = React.useState<
    'file' | 'folder' | null
  >(null);

  const handleClearSelection = React.useCallback(() => {
    setSelectedItem(null);
    onFolderSelect?.(null);
  }, [onFolderSelect]);

  // useHotkeys(
  //   'mod+v',
  //   () => {
  //     if (clipboard) {
  //       onPasteItem?.(clipboard.id);
  //     }
  //   },
  //   { preventDefault: true, enableOnFormTags: false },
  //   [onPasteItem, clipboard],
  // );

  return (
    <Sidebar {...props} ref={sidebarRef}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarContent
            className="select-none h-full"
            onClick={handleClearSelection}
          >
            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex justify-between w-full">
                  <div>Explorer</div>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CreateInputDialog
                      title="Add new folder"
                      description="This will add a new folder"
                      onSubmit={(name) =>
                        onFolderCreate?.(name, selectedFolderId)
                      }
                    >
                      <Folder className="h-[0.9rem] w-[0.9rem] cursor-pointer hover:bg-zinc-700" />
                    </CreateInputDialog>
                    <CreateInputDialog
                      title="Add new item"
                      description="This will add a new item"
                      onSubmit={(name) =>
                        onFileCreate?.(name, selectedFolderId)
                      }
                    >
                      <File className="h-[0.9rem] w-[0.9rem] cursor-pointer hover:bg-zinc-700" />
                    </CreateInputDialog>
                  </div>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent onClick={(e) => e.stopPropagation()}>
                <SidebarMenu>
                  {tree.map((item) => (
                    <Tree
                      key={item.id}
                      item={item}
                      onFileSelect={onFileSelect}
                      onFileDelete={onFileDelete}
                      onFolderDelete={onFolderDelete}
                      onFileRename={onFileRename}
                      onFolderRename={onFolderRename}
                      onCreateFile={onFileCreate}
                      onCreateFolder={onFolderCreate}
                      onFileDuplicate={onFileDuplicate}
                      onFolderDuplicate={onFolderDuplicate}
                      onFileCopy={onFileCopy}
                      onFolderCopy={onFolderCopy}
                      onFileCut={onFileCut}
                      onFolderCut={onFolderCut}
                      onPasteItem={onPasteItem}
                      clipboard={clipboard}
                      selectedItemId={selectedItem?.id}
                      onItemSelect={handleItemSelect}
                      isMac={isMac}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem inset onClick={() => setRootMenuOpen('file')}>
            New File
            <ContextMenuShortcut>{isMac ? '⌘' : 'Ctrl+'}N</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem inset onClick={() => setRootMenuOpen('folder')}>
            New Folder
          </ContextMenuItem>
          {clipboard && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem inset onClick={() => onPasteItem?.(null)}>
                Paste
                <ContextMenuShortcut>
                  {isMac ? '⌘' : 'Ctrl+'}V
                </ContextMenuShortcut>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <SidebarRail />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItem?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedItem?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedItem) {
                  if (selectedItem.type === 'file') {
                    onFileDelete?.(selectedItem.id);
                  } else {
                    onFolderDelete?.(selectedItem.id);
                  }
                }
                setSelectedItem(null);
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateInputDialog
        title="Add new item"
        description="This will add a new item"
        onSubmit={(name) => onFileCreate?.(name, selectedFolderId)}
        open={newFileDialogOpen}
        onOpenChange={setNewFileDialogOpen}
      />

      <CreateInputDialog
        title="Add new file"
        description="This will add a new file at root level"
        onSubmit={(name) => onFileCreate?.(name, null)}
        open={rootMenuOpen === 'file'}
        onOpenChange={(isOpen) => setRootMenuOpen(isOpen ? 'file' : null)}
      />

      <CreateInputDialog
        title="Add new folder"
        description="This will add a new folder at root level"
        onSubmit={(name) => onFolderCreate?.(name, null)}
        open={rootMenuOpen === 'folder'}
        onOpenChange={(isOpen) => setRootMenuOpen(isOpen ? 'folder' : null)}
      />
    </Sidebar>
  );
}

function MenuContent({
  type,
  name,
  parentId,
  entityId,
  onDelete,
  onRename,
  onCreateFile,
  onCreateFolder,
  onDuplicate,
  onCopy,
  onCut,
  onPaste,
  hasClipboard,
  isMac,
}: {
  type: 'file' | 'folder';
  name: string;
  parentId?: string | null;
  entityId: string;
  onDelete?: () => void;
  onRename?: (name: string) => void;
  onCreateFile?: (name: string, parentId?: string | null) => void;
  onCreateFolder?: (name: string, parentId?: string | null) => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  hasClipboard?: boolean;
  isMac?: boolean;
}) {
  const forFolder = type === 'folder';
  const [open, setOpen] = React.useState<
    'file' | 'folder' | 'rename' | 'delete' | null
  >(null);
  const copyToClipboard = useCopyToClipboard();

  const modKey = isMac ? '⌘' : 'Ctrl+';

  return (
    <React.Fragment>
      <ContextMenuContent className="w-52">
        {forFolder ? (
          <>
            <ContextMenuItem
              inset
              onClick={() => {
                setOpen('file');
              }}
            >
              New File
              <ContextMenuShortcut>{modKey}N</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              inset
              onClick={() => {
                setOpen('folder');
              }}
            >
              New Folder
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        ) : null}

        <ContextMenuItem inset onClick={onCut}>
          Cut
          <ContextMenuShortcut>{modKey}X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset onClick={onCopy}>
          Copy
          <ContextMenuShortcut>{modKey}C</ContextMenuShortcut>
        </ContextMenuItem>
        {forFolder && (
          <ContextMenuItem inset onClick={onPaste} disabled={!hasClipboard}>
            Paste
            <ContextMenuShortcut>{modKey}V</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuItem inset onClick={onDuplicate}>
          Duplicate
          <ContextMenuShortcut>{modKey}D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />

        <ContextMenuItem inset onClick={() => copyToClipboard(entityId)}>
          Copy ID
        </ContextMenuItem>
        <ContextMenuItem
          inset
          onClick={() => {
            setOpen('rename');
          }}
        >
          Rename
          <ContextMenuShortcut>{isMac ? '↩' : 'F2'}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          inset
          variant="destructive"
          onClick={() => setOpen('delete')}
        >
          Delete
          <ContextMenuShortcut>{isMac ? '⌘⌫' : 'Del'}</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>

      <AlertDialog
        open={open === 'delete'}
        onOpenChange={(isOpen) => setOpen(isOpen ? 'delete' : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.();
                setOpen(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateInputDialog
        title="Rename"
        description="Enter the new name"
        defaultValue={name}
        onSubmit={(newName) => {
          onRename?.(newName);
        }}
        open={open === 'rename'}
        onOpenChange={(isOpen) => {
          setOpen(isOpen ? 'rename' : null);
        }}
        submitLabel="Rename"
      />

      <CreateInputDialog
        title="Add new folder"
        description="This will add a new folder"
        onSubmit={(name) => {
          onCreateFolder?.(name, parentId);
        }}
        open={open === 'folder'}
        onOpenChange={(isOpen) => {
          setOpen(isOpen ? 'folder' : null);
        }}
      />

      <CreateInputDialog
        title="Add new file"
        description="This will add a new file"
        onSubmit={(name) => {
          onCreateFile?.(name, parentId);
        }}
        open={open === 'file'}
        onOpenChange={(isOpen) => {
          setOpen(isOpen ? 'file' : null);
        }}
      />
    </React.Fragment>
  );
}

function Tree({
  item,
  onFileSelect,
  onFileDelete,
  onFolderDelete,
  onFileRename,
  onFolderRename,
  onCreateFile,
  onCreateFolder,
  onFileDuplicate,
  onFolderDuplicate,
  onFileCopy,
  onFolderCopy,
  onFileCut,
  onFolderCut,
  onPasteItem,
  clipboard,
  selectedItemId,
  onItemSelect,
  isMac,
}: {
  item: FileTreeItem;
  onFileSelect?: (id: string) => void;
  onFileDelete?: (id: string) => void;
  onFolderDelete?: (id: string) => void;
  onFileRename?: (id: string, name: string) => void;
  onFolderRename?: (id: string, name: string) => void;
  onCreateFile?: (name: string, parentId?: string | null) => void;
  onCreateFolder?: (name: string, parentId?: string | null) => void;
  onFileDuplicate?: (id: string) => void;
  onFolderDuplicate?: (id: string) => void;
  onFileCopy?: (id: string) => void;
  onFolderCopy?: (id: string) => void;
  onFileCut?: (id: string) => void;
  onFolderCut?: (id: string) => void;
  onPasteItem?: (targetFolderId: string | null) => void;
  clipboard?: ClipboardItem | null;
  selectedItemId?: string;
  onItemSelect?: (id: string, type: 'file' | 'folder', name: string) => void;
  isMac?: boolean;
}) {
  const { name, children } = item;
  const isSelected = selectedItemId === item.id;
  const isCut = clipboard?.id === item.id && clipboard?.operation === 'cut';

  useHotkeys(
    'mod+c',
    () => {
      if (item.type === 'file') {
        onFileCopy?.(item.id);
      } else {
        onFolderCopy?.(item.id);
      }
    },
    { preventDefault: true, enableOnFormTags: false },
    [onFileCopy],
  );

  useHotkeys(
    'mod+x',
    () => {
      if (item.type === 'file') {
        onFileCut?.(item.id);
      } else {
        onFolderCut?.(item.id);
      }
    },
    { preventDefault: true, enableOnFormTags: false },
    [onFileCut],
  );

  useHotkeys(
    'mod+v',
    () => {
      onPasteItem?.(item.id);
    },
    { preventDefault: true, enableOnFormTags: false },
    [onPasteItem],
  );

  if (item.type === 'file') {
    const Icon = item.icon;

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuButton
            className={cn(
              'data-[active=true]:bg-transparent text-xs truncate',
              isSelected && 'bg-accent',
              isCut && 'opacity-50',
            )}
            onClick={() => {
              onFileSelect?.(item.id);
              onItemSelect?.(item.id, 'file', name);
            }}
          >
            {/* @ts-ignore */}
            {Icon && <Icon short />}
            {name || ''}
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <MenuContent
          type="file"
          name={name}
          entityId={item.id}
          onDelete={() => onFileDelete?.(item.id)}
          onRename={(newName) => onFileRename?.(item.id, newName)}
          onDuplicate={() => onFileDuplicate?.(item.id)}
          onCopy={() => onFileCopy?.(item.id)}
          onCut={() => onFileCut?.(item.id)}
          isMac={isMac}
        />
      </ContextMenu>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={cn(
                  'text-xs truncate',
                  isSelected && 'bg-accent',
                  isCut && 'opacity-50',
                )}
                onClick={() => onItemSelect?.(item.id, 'folder', name)}
              >
                <ChevronRight className="transition-transform" />
                <MdFolder />
                {name}
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </ContextMenuTrigger>
          <MenuContent
            type="folder"
            name={name}
            entityId={item.id}
            parentId={item.id}
            onDelete={() => onFolderDelete?.(item.id)}
            onRename={(newName) => onFolderRename?.(item.id, newName)}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            onDuplicate={() => onFolderDuplicate?.(item.id)}
            onCopy={() => onFolderCopy?.(item.id)}
            onCut={() => onFolderCut?.(item.id)}
            onPaste={() => onPasteItem?.(item.id)}
            hasClipboard={!!clipboard}
            isMac={isMac}
          />
        </ContextMenu>
        <CollapsibleContent>
          <SidebarMenuSub className="px-1 py-0">
            {children?.map((subItem) => (
              <Tree
                key={subItem.id}
                item={subItem}
                onFileSelect={onFileSelect}
                onFileDelete={onFileDelete}
                onFolderDelete={onFolderDelete}
                onFileRename={onFileRename}
                onFolderRename={onFolderRename}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onFileDuplicate={onFileDuplicate}
                onFolderDuplicate={onFolderDuplicate}
                onFileCopy={onFileCopy}
                onFolderCopy={onFolderCopy}
                onFileCut={onFileCut}
                onFolderCut={onFolderCut}
                onPasteItem={onPasteItem}
                clipboard={clipboard}
                selectedItemId={selectedItemId}
                onItemSelect={onItemSelect}
                isMac={isMac}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
