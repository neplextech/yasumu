import { ChevronRight, File, Folder } from 'lucide-react';
import * as React from 'react';

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

export interface FileTreeItem {
  id: string;
  name: string;
  icon?: React.ComponentType;
  children?: FileTreeItem[];
  type: 'folder' | 'file';
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
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  fileTree: FileTreeItem[];
  onFileSelect?: (id: string) => void;
  onFileCreate?: (name: string, parentId?: string | null) => void;
  onFolderCreate?: (name: string, parentId?: string | null) => void;
  onFileDelete?: (id: string) => void;
  onFolderDelete?: (id: string) => void;
  onFileRename?: (id: string, name: string) => void;
  onFolderRename?: (id: string, name: string) => void;
}) {
  const tree = Array.isArray(fileTree) ? fileTree : [fileTree];

  return (
    <Sidebar {...props}>
      <SidebarContent className="select-none">
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex justify-between w-full">
              <div>Requests</div>
              <div className="flex items-center gap-2">
                <CreateInputDialog
                  title="Add new folder"
                  description="This will add a new folder"
                  onSubmit={onFolderCreate}
                >
                  <Folder className="h-[0.9rem] w-[0.9rem] cursor-pointer hover:bg-zinc-700" />
                </CreateInputDialog>
                <CreateInputDialog
                  title="Add new item"
                  description="This will add a new item"
                  onSubmit={onFileCreate}
                >
                  <File className="h-[0.9rem] w-[0.9rem] cursor-pointer hover:bg-zinc-700" />
                </CreateInputDialog>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
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
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function MenuContent({
  type,
  name,
  parentId,
  onDelete,
  onRename,
  onCreateFile,
  onCreateFolder,
}: {
  type: 'file' | 'folder';
  name: string;
  parentId?: string | null;
  onDelete?: () => void;
  onRename?: (name: string) => void;
  onCreateFile?: (name: string, parentId?: string | null) => void;
  onCreateFolder?: (name: string, parentId?: string | null) => void;
}) {
  const forFolder = type === 'folder';
  const [open, setOpen] = React.useState<
    'file' | 'folder' | 'rename' | 'delete' | null
  >(null);

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

        <ContextMenuItem
          inset
          onClick={() => {
            setOpen('rename');
          }}
        >
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          inset
          variant="destructive"
          onClick={() => setOpen('delete')}
        >
          Delete
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
}: {
  item: FileTreeItem;
  onFileSelect?: (id: string) => void;
  onFileDelete?: (id: string) => void;
  onFolderDelete?: (id: string) => void;
  onFileRename?: (id: string, name: string) => void;
  onFolderRename?: (id: string, name: string) => void;
  onCreateFile?: (name: string, parentId?: string | null) => void;
  onCreateFolder?: (name: string, parentId?: string | null) => void;
}) {
  const { name, children } = item;

  if (item.type === 'file') {
    const Icon = item.icon;

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuButton
            className="data-[active=true]:bg-transparent text-xs truncate"
            onClick={() => onFileSelect?.(item.id)}
          >
            {/* @ts-ignore */}
            {Icon && <Icon short />}
            {name || ''}
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <MenuContent
          type="file"
          name={name}
          onDelete={() => onFileDelete?.(item.id)}
          onRename={(newName) => onFileRename?.(item.id, newName)}
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
              <SidebarMenuButton className="text-xs truncate">
                <ChevronRight className="transition-transform" />
                <MdFolder />
                {name}
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </ContextMenuTrigger>
          <MenuContent
            type="folder"
            name={name}
            parentId={item.id}
            onDelete={() => onFolderDelete?.(item.id)}
            onRename={(newName) => onFolderRename?.(item.id, newName)}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
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
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
