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

const truncate = (str: string, length: number) =>
  str.length > length ? `${str.slice(0, length)}...` : str;

export interface FileTreeItem {
  name: string;
  icon?: React.ComponentType;
  children?: FileTreeItem[];
}

export function FileTreeSidebar({
  fileTree,
  onFileCreate,
  onFolderCreate,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  fileTree: FileTreeItem[];
  onFileCreate?: (name: string) => void;
  onFolderCreate?: (name: string) => void;
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
              {tree.map((item, index) => (
                <Tree key={index} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function MenuContent({ type }: { type: 'file' | 'folder' }) {
  const forFolder = type === 'folder';
  const [open, setOpen] = React.useState<'file' | 'folder' | null>(null);

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

        <ContextMenuItem inset>Rename</ContextMenuItem>
        <ContextMenuItem inset variant="destructive">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>

      <CreateInputDialog
        title="Add new folder"
        description="This will add a new folder"
        onSubmit={(name) => {
          console.log('Create folder:', name);
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
          console.log('Create file:', name);
        }}
        open={open === 'file'}
        onOpenChange={(isOpen) => {
          setOpen(isOpen ? 'file' : null);
        }}
      />
    </React.Fragment>
  );
}

function Tree({ item }: { item: FileTreeItem }) {
  const { name, children } = item;

  if (!children?.length) {
    const Icon = item.icon;

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuButton className="data-[active=true]:bg-transparent text-xs truncate">
            {/* @ts-ignore */}
            {Icon && <Icon short />}
            {name || ''}
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <MenuContent type="file" />
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
          <MenuContent type="folder" />
        </ContextMenu>
        <CollapsibleContent>
          <SidebarMenuSub className="px-1 py-0">
            {children.map((subItem: any, index: number) => (
              <Tree key={index} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
