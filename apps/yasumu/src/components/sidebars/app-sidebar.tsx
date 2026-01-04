'use client';

import { ChevronsUpDown, Home, Lock, Logs, Mail, Settings } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@yasumu/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@yasumu/ui/components/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@yasumu/ui/components/sidebar';
import YasumuLogo from '@/components/visuals/yasumu-logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SidebarThemeSelector from './theme-selector';
import { TbWorldWww } from 'react-icons/tb';
import { SiDiscord, SiGithub } from 'react-icons/si';
import { YasumuSocials } from '@/lib/constants/socials';
import SidebarLayoutStyleSelector from './layout-style-selector';
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';
import { useEffect, useState } from 'react';
import { AppMenu } from './app-menu';
import { useYasumu } from '../providers/workspace-provider';
import { getVersion, getName, getTauriVersion } from '@tauri-apps/api/app';
import { Skeleton } from '@yasumu/ui/components/skeleton';
import { useUpdater } from '../providers/updater-provider';
import { cn } from '@yasumu/ui/lib/utils';
import { IoSync } from 'react-icons/io5';

const data = {
  user: {
    name: 'Yasumu User',
    email: 'user@yasumu.dev',
    avatar: '/Yasumu Dark.svg',
  },
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: Home,
      isActive: true,
    },
    {
      title: 'Rest API',
      url: '/en/workspaces/default/rest',
      icon: TbWorldWww,
      isActive: false,
    },
    // {
    //   title: 'GraphQL',
    //   url: '/en/workspaces/default/graphql',
    //   icon: SiGraphql,
    //   isActive: false,
    // },
    // {
    //   title: 'Socket.IO',
    //   url: '/en/workspaces/default/socketio',
    //   icon: SiSocketdotio,
    //   isActive: false,
    // },
    // {
    //   title: 'WebSocket',
    //   url: '/en/workspaces/default/websocket',
    //   icon: WebSocketIcon,
    //   isActive: false,
    // },
    // {
    //   title: 'Server Sent Events',
    //   url: '/en/workspaces/default/sse',
    //   icon: Zap,
    //   isActive: false,
    // },
    {
      title: 'Emails',
      url: '/en/workspaces/default/emails',
      icon: Mail,
      isActive: false,
    },
  ],
  navFooter: [
    {
      title: 'Environment',
      url: '/en/workspaces/default/environment',
      icon: Lock,
    },
  ],
};

export function AppSidebar() {
  const { setOpen } = useSidebar();
  const path = usePathname();
  const { currentWorkspaceId } = useYasumu();

  if (!currentWorkspaceId) return null;

  return (
    <Sidebar
      collapsible="none"
      className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <AppMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url as any}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setOpen(true);
                      }}
                      isActive={path === item.url}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {data.navFooter.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url as any}>
                <SidebarMenuButton
                  tooltip={{
                    children: item.title,
                    hidden: false,
                  }}
                  onClick={() => {
                    setOpen(true);
                  }}
                  isActive={path === item.url}
                  className="px-2.5 md:px-2"
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          <SettingsDropdown user={data.user} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function SettingsDropdown({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage alt={'Settings'} />
              <AvatarFallback className="rounded-lg">
                <Settings className="size-4" />
              </AvatarFallback>
            </Avatar>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          side={isMobile ? 'bottom' : 'right'}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-start gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  <YasumuLogo className="size-4 dark:invert-0 invert" />
                </AvatarFallback>
              </Avatar>
              <AppInfo />
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {/* @ts-ignore */}
            <Link href="/en/settings">
              <DropdownMenuItem>
                <Settings />
                Settings
              </DropdownMenuItem>
            </Link>
            <SidebarThemeSelector />
            <SidebarLayoutStyleSelector />
            <KeyboardShortcutsDialog />
            <Link href={YasumuSocials.Changelogs as any} target="_blank">
              <DropdownMenuItem>
                <Logs />
                Changelogs
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href={YasumuSocials.GitHub as any} target="_blank">
              <DropdownMenuItem>
                <SiGithub />
                GitHub
              </DropdownMenuItem>
            </Link>
            <Link href={YasumuSocials.Discord as any} target="_blank">
              <DropdownMenuItem>
                <SiDiscord />
                Discord
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <CheckForUpdates />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function CheckForUpdates() {
  const { isChecking, checkForUpdates } = useUpdater();

  return (
    <DropdownMenuItem onClick={() => void checkForUpdates()}>
      <IoSync className={cn(isChecking && 'animate-spin')} />
      {isChecking ? 'Checking for Updates...' : 'Check for Updates'}
    </DropdownMenuItem>
  );
}

function AppInfo() {
  const [info, setInfo] = useState<{
    name: string;
    version: string;
    tauriVersion: string;
  } | null>(null);
  const { port } = useYasumu();

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const [name, version, tauriVersion] = await Promise.all([
          getName(),
          getVersion(),
          getTauriVersion(),
        ]);

        setInfo({ name, version, tauriVersion });
      } catch (e) {
        console.error(e);
      }
    };

    fetchInfo();
  }, []);

  return (
    <div className="grid flex-1 text-left text-sm leading-tight font-medium">
      {!info ? (
        <>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24 mt-1" />
        </>
      ) : (
        <>
          <span className="truncate font-semibold">{info.name}</span>
          <span className="truncate text-xs">
            v{info.version} | Tauri: v{info.tauriVersion}
          </span>
          <span className="truncate text-xs">RPC Port: {port}</span>
        </>
      )}
    </div>
  );
}
