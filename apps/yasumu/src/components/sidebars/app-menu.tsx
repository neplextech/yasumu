'use client';
import { useQuery } from '@tanstack/react-query';
import { open } from '@tauri-apps/plugin-dialog';
import { asPathIdentifier, DEFAULT_WORKSPACE_PATH } from '@yasumu/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@yasumu/ui/components/dropdown-menu';
import { SidebarMenuButton } from '@yasumu/ui/components/sidebar';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { SiPostman } from 'react-icons/si';

import { useYasumuRuntime } from '@/components/providers/workspace-provider';
import YasumuLogo from '@/components/visuals/yasumu-logo';

import PostmanImportDialog from '../dialogs/postman-import-dialog';

export function AppMenu() {
  const { yasumu } = useYasumuRuntime();
  const [postmanImportDialog, setPostmanImportDialog] = useState(false);

  const {
    data: recentWorkspaces,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['recent-workspaces'],
    queryFn: async () => {
      const workspaces = await yasumu.workspaces.list({ take: 5 });
      return workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        path: workspace.path,
      }));
    },
  });

  const handleOpenWorkspace = withErrorHandler(async (isDefault = false) => {
    if (isDefault) {
      await yasumu.workspaces.open({
        id: asPathIdentifier(DEFAULT_WORKSPACE_PATH),
      });
      return;
    }

    const folder = await open({
      canCreateDirectories: true,
      directory: true,
      multiple: false,
      title: 'Open Yasumu Workspace',
    });

    if (!folder) return;

    await yasumu.workspaces.create({
      name: folder.replaceAll('\\', '/').split('/').pop() ?? 'Untitled Workspace',
      metadata: {
        path: folder,
      },
    });
  });

  const handleOpenRecentWorkspace = (workspaceId: string) =>
    withErrorHandler(async () => {
      await yasumu.workspaces.open({ id: workspaceId });
    });

  const onImportFromPostman = () => {
    setPostmanImportDialog(true);
  };

  const handleCloseCurrentWorkspace = withErrorHandler(async () => {
    const activeWorkspace = yasumu.workspaces.getActiveWorkspace();
    if (!activeWorkspace) return;
    await yasumu.workspaces.close(activeWorkspace);
  });

  return (
    <>
      <PostmanImportDialog open={postmanImportDialog} onOpenChange={setPostmanImportDialog} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" className="md:h-8 md:p-0" aria-label="Open workspace menu">
            <span className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg bg-[#272a37]">
              <YasumuLogo className="size-4" />
            </span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Import Workspace</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={onImportFromPostman}>
                    <SiPostman className="fill-[#ff6c37]" />
                    Import from Postman
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleOpenWorkspace(false)}>Open Workspace</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpenWorkspace(true)}>Open Default Workspace</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Open Recent</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="min-w-[200px]">
                {isLoading ? (
                  <DropdownMenuItem disabled>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading...
                  </DropdownMenuItem>
                ) : isError ? (
                  <DropdownMenuItem disabled>Could not load recent workspaces</DropdownMenuItem>
                ) : !recentWorkspaces?.length ? (
                  <DropdownMenuItem disabled>No recent workspaces</DropdownMenuItem>
                ) : (
                  recentWorkspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={handleOpenRecentWorkspace(workspace.id)}
                      className="flex flex-col items-start gap-0.5"
                    >
                      <span className="font-medium">{workspace.name}</span>
                      <span className="text-muted-foreground max-w-[180px] truncate font-mono text-xs">
                        {workspace.path === DEFAULT_WORKSPACE_PATH ? 'Default Workspace' : workspace.path}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={handleCloseCurrentWorkspace}>Close Current Workspace</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
