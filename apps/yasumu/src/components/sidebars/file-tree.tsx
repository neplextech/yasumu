import * as React from 'react';
import { ChevronRight, File, Folder } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@yasumu/ui/components/collapsible';
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

export function FileTreeSidebar({
  fileTree,
  resolveIcon,
  onFileCreate,
  onFolderCreate,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  fileTree: any[];
  resolveIcon?: (entity: any) => () => React.ReactNode;
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
                <Tree key={index} item={item} resolveIcon={resolveIcon} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Tree({
  item,
  resolveIcon,
}: {
  item: any;
  resolveIcon?: (entity: any) => () => React.ReactNode;
}) {
  const { name, children } = item;

  if (!children?.length) {
    const Icon = resolveIcon?.(item);

    return (
      <SidebarMenuButton className="data-[active=true]:bg-transparent text-xs">
        {Icon && <Icon />}
        {truncate(name || '', 20)}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="text-xs">
            <ChevronRight className="transition-transform" />
            <MdFolder />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
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
