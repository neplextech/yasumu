'use client';

import { ChevronsUpDown, Keyboard, Lock, Logs, Mail, Settings, Zap } from 'lucide-react';
import { IoSync } from 'react-icons/io5';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/sidebar';
import YasumuLogo from '../assets/YasumuLogo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SidebarThemeSelector from './ThemeSelector';
import { TbWorldWww } from 'react-icons/tb';
import { SiDiscord, SiGithub, SiGraphql, SiSocketdotio } from 'react-icons/si';
import WebSocketLogo from '../assets/WebSocketLogo';
import { YasumuSocials } from '@/lib/constants/socials';
import SidebarLayoutStyleSelector from './LayoutStyleSelector';
import { useEffect, useState } from 'react';
import { useYasumu } from '@/providers/WorkspaceProvider';
import { AppMenu } from './AppMenu';

const data = {
  user: {
    name: 'Yasumu User',
    email: 'user@yasumu.dev',
    avatar: '/Yasumu Dark.svg',
  },
  navMain: [
    // {
    //   title: 'Home',
    //   url: '/',
    //   icon: Home,
    //   isActive: true,
    // },
    {
      title: 'Rest API',
      url: '/rest',
      icon: TbWorldWww,
      isActive: false,
    },
    {
      title: 'GraphQL',
      url: '/graphql',
      icon: SiGraphql,
      isActive: false,
    },
    {
      title: 'Socket.IO',
      url: '/socketio',
      icon: SiSocketdotio,
      isActive: false,
    },
    {
      title: 'WebSocket',
      url: '/websocket',
      icon: WebSocketLogo,
      isActive: false,
    },
    {
      title: 'Server Sent Events',
      url: '/sse',
      icon: Zap,
      isActive: false,
    },
    {
      title: 'Emails',
      url: '/emails',
      icon: Mail,
      isActive: false,
    },
  ],
  navFooter: [
    {
      title: 'Environment',
      url: '/environment',
      icon: Lock,
    },
  ],
};

export function AppSidebar() {
  const { setOpen } = useSidebar();
  const path = usePathname();

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
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url}>
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
              <Link href={item.url}>
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
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
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
            <DropdownMenuItem>
              <Settings />
              Settings
            </DropdownMenuItem>
            <SidebarThemeSelector />
            <SidebarLayoutStyleSelector />
            <DropdownMenuItem>
              <Keyboard />
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Logs />
              Changelogs
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href={YasumuSocials.GitHub} target="_blank">
              <DropdownMenuItem>
                <SiGithub />
                GitHub
              </DropdownMenuItem>
            </Link>
            <Link href={YasumuSocials.Discord} target="_blank">
              <DropdownMenuItem>
                <SiDiscord />
                Discord
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <IoSync />
              Check for Updates
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function AppInfo() {
  const { yasumu } = useYasumu();
  const [info, setInfo] = useState({
    name: 'Yasumu',
    version: '0.0.0',
  });

  useEffect(() => {
    (async () => {
      const [name, version] = await Promise.all([yasumu.app.getName(), yasumu.app.getVersion()]);

      setInfo({
        name,
        version,
      });
    })().catch(console.error);
  }, [yasumu]);

  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">{info.name}</span>
      <span className="truncate text-xs">v{info.version}</span>
    </div>
  );
}
