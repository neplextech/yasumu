'use client';
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
import YasumuLogo from '@/components/visuals/yasumu-logo';
import { useYasumu } from '@/components/providers/workspace-provider';
import { open } from '@tauri-apps/plugin-dialog';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_WORKSPACE_PATH } from '@yasumu/tanxium/src/rpc/common/constants';
import { Loader2 } from 'lucide-react';
// import { FaJava } from 'react-icons/fa';
// import {
//   SiGo,
//   SiInsomnia,
//   SiJavascript,
//   SiOpenapiinitiative,
//   SiPostman,
//   SiPython,
//   SiTypescript,
// } from 'react-icons/si';

export function AppMenu() {
  const { yasumu } = useYasumu();

  const { data: recentWorkspaces, isLoading } = useQuery({
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

  const handleOpenWorkspace = withErrorHandler(async () => {
    const folder = await open({
      canCreateDirectories: true,
      directory: true,
      multiple: false,
      title: 'Open Yasumu Workspace',
    });

    if (!folder) return;

    await yasumu.workspaces.create({
      name:
        folder.replaceAll('\\', '/').split('/').pop() ?? 'Untitled Workspace',
      metadata: {
        path: folder,
      },
    });
    window.location.reload();
  });

  const handleOpenRecentWorkspace = (workspaceId: string) =>
    withErrorHandler(async () => {
      await yasumu.workspaces.open({ id: workspaceId });
      window.location.reload();
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#272a37] text-sidebar-primary-foreground">
            <YasumuLogo className="size-4" />
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleOpenWorkspace}>
            New Workspace
          </DropdownMenuItem>
          {/* <DropdownMenuSub>
            <DropdownMenuSubTrigger>Import Workspace</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  <YasumuLogo />
                  Standalone Format
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SiPostman className="fill-[#ff6c37]" />
                  Import from Postman
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SiInsomnia className="fill-[#5849be]" />
                  Import from Insomnia
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SiOpenapiinitiative className="fill-[#94c83d]" />
                  Import from OpenAPI
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub> */}
          {/* <DropdownMenuItem>Rename Workspace</DropdownMenuItem> */}
        </DropdownMenuGroup>
        {/* <DropdownMenuSeparator /> */}
        <DropdownMenuItem onClick={handleOpenWorkspace}>
          Open Workspace
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Open Recent</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="min-w-[200px]">
              {isLoading ? (
                <DropdownMenuItem disabled>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Loading...
                </DropdownMenuItem>
              ) : !recentWorkspaces?.length ? (
                <DropdownMenuItem disabled>No recent data!</DropdownMenuItem>
              ) : (
                recentWorkspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={handleOpenRecentWorkspace(workspace.id)}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">{workspace.name}</span>
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                      {workspace.path === DEFAULT_WORKSPACE_PATH
                        ? 'Default Workspace'
                        : workspace.path}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        {/* <DropdownMenuSeparator /> */}
        {/* <DropdownMenuItem>Duplicate Workspace</DropdownMenuItem> */}
        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger>Export Workspace</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem>
                <YasumuLogo />
                Export as Standalone
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SiPostman className="fill-[#ff6c37]" />
                Export as Postman
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SiInsomnia className="fill-[#5849be]" />
                Export as Insomnia
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SiOpenapiinitiative className="fill-[#94c83d]" />
                Export as OpenAPI
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub> */}
        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger>Generate</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>API Client</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>
                      <SiJavascript className="fill-[#f0db4f]" />
                      JavaScript
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      {' '}
                      <SiTypescript className="fill-[#007acc]" />
                      TypeScript
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <SiPython className="fill-[#306998]" />
                      Python
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FaJava className="fill-[#5382a1]" />
                      Java
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <SiGo className="fill-[#00add8]" />
                      Go
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Types</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>
                      <SiTypescript className="fill-[#007acc]" />
                      TypeScript
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub> */}
        <DropdownMenuSeparator />
        {/* <DropdownMenuItem>Auto Save</DropdownMenuItem> */}
        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger>Tasks</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Run</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Run All</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Run REST</DropdownMenuItem>
                    <DropdownMenuItem>Run GraphQL</DropdownMenuItem>
                    <DropdownMenuItem>Run WebSocket</DropdownMenuItem>
                    <DropdownMenuItem>Run SocketIO</DropdownMenuItem>
                    <DropdownMenuItem>Run SSE</DropdownMenuItem>
                    <DropdownMenuItem>Run Emails</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Test</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Test All</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Test REST</DropdownMenuItem>
                    <DropdownMenuItem>Test GraphQL</DropdownMenuItem>
                    <DropdownMenuItem>Test WebSocket</DropdownMenuItem>
                    <DropdownMenuItem>Test SocketIO</DropdownMenuItem>
                    <DropdownMenuItem>Test SSE</DropdownMenuItem>
                    <DropdownMenuItem>Test Emails</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem>Manage Dependencies</DropdownMenuItem>
        <DropdownMenuItem>View Documentation</DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
