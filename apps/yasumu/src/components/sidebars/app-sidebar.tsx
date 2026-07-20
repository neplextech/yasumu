'use client';

import { getVersion, getName, getTauriVersion } from '@tauri-apps/api/app';
import { Avatar, AvatarFallback, AvatarImage } from '@yasumu/ui/components/avatar';
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
import { Skeleton } from '@yasumu/ui/components/skeleton';
import { cn } from '@yasumu/ui/lib/utils';
import { ChevronsUpDown, Lock, Logs, Mail, Settings } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoSync } from 'react-icons/io5';
import { SiDiscord, SiGithub, SiGraphql } from 'react-icons/si';
import { TbWorldWww } from 'react-icons/tb';

import YasumuLogo from '@/components/visuals/yasumu-logo';
import { YasumuSocials } from '@/lib/constants/socials';

import { useUpdater } from '../providers/updater-provider';
import { useWorkspaceSession, useYasumuRuntime } from '../providers/workspace-provider';
import { CookieJarSheet } from '../workspace/cookie-jar/cookie-jar-sheet';
import { AppMenu } from './app-menu';
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';
import SidebarLayoutStyleSelector from './layout-style-selector';
import SidebarThemeSelector from './theme-selector';

const data = {
  user: {
    name: 'Yasumu User',
    email: 'user@yasumu.dev',
    avatar: '/Yasumu Dark.svg',
  },
  navMain: [
    {
      title: 'Rest API',
      section: 'rest',
      icon: TbWorldWww,
    },
    {
      title: 'GraphQL',
      section: 'graphql',
      icon: SiGraphql,
    },
    {
      title: 'Emails',
      section: 'emails',
      icon: Mail,
    },
  ],
  navFooter: [
    {
      title: 'Environment',
      section: 'environment',
      icon: Lock,
    },
  ],
} as const;

export function AppSidebar() {
  const { setOpen } = useSidebar();
  const path = usePathname();
  const { currentWorkspaceId } = useWorkspaceSession();
  const locale = path.split('/').filter(Boolean)[0] ?? 'en';
  const workspaceRoute = `/${locale}/workspaces/default`;

  if (!currentWorkspaceId) return null;

  return (
    <Sidebar collapsible="none" className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
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
              {data.navMain.map((item) => {
                const href = `${workspaceRoute}/${item.section}` as Route;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={{ children: item.title, hidden: false }}
                      isActive={path === href}
                      className="px-2.5 md:px-2"
                    >
                      <Link href={href} onClick={() => setOpen(true)}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {data.navFooter.map((item) => {
            const href = `${workspaceRoute}/${item.section}` as Route;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={{ children: item.title, hidden: false }}
                  isActive={path === href}
                  className="px-2.5 md:px-2"
                >
                  <Link href={href} onClick={() => setOpen(true)}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          <CookieJarSheet />
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
            aria-label="Open application menu"
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
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
                  <YasumuLogo className="size-4 invert dark:invert-0" />
                </AvatarFallback>
              </Avatar>
              <AppInfo />
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/en/settings">
                <Settings />
                Settings
              </Link>
            </DropdownMenuItem>
            <SidebarThemeSelector />
            <SidebarLayoutStyleSelector />
            <KeyboardShortcutsDialog />
            <DropdownMenuItem asChild>
              <a href={YasumuSocials.Changelogs} target="_blank" rel="noreferrer">
                <Logs />
                Changelogs
              </a>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <a href={YasumuSocials.GitHub} target="_blank" rel="noreferrer">
                <SiGithub />
                GitHub
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={YasumuSocials.Discord} target="_blank" rel="noreferrer">
                <SiDiscord />
                Discord
              </a>
            </DropdownMenuItem>
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
    <DropdownMenuItem onClick={() => void checkForUpdates(true)}>
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
  const { port } = useYasumuRuntime();

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const [name, version, tauriVersion] = await Promise.all([getName(), getVersion(), getTauriVersion()]);

        setInfo({ name, version, tauriVersion });
      } catch (e) {
        console.error(e);
      }
    };

    void fetchInfo();
  }, []);

  return (
    <div className="grid flex-1 text-left text-sm leading-tight font-medium">
      {!info ? (
        <>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-1 h-4 w-24" />
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
