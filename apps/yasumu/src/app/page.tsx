import YasumuLogo from '@/components/visuals/yasumu-logo';
import { YasumuSocials } from '@/lib/constants/socials';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@yasumu/ui/components/card';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { ArrowRight, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { BsDiscord, BsGithub } from 'react-icons/bs';
import YasumuRpcStatus from '@/components/visuals/yasumu-rpc-status';

interface RecentWorkspace {
  id: string;
  name: string;
  path: string;
  lastOpened?: string;
}

const dummyWorkspaces: RecentWorkspace[] = [
  {
    id: '1',
    name: 'yasumu',
    path: '~/Developer/projects/yasumu',
    lastOpened: '2 hours ago',
  },
  {
    id: '2',
    name: 'flipmeet',
    path: '~/Developer/projects/flipmeet',
    lastOpened: '1 day ago',
  },
  {
    id: '3',
    name: 'transletta',
    path: '~/Developer/projects/transletta',
    lastOpened: '3 days ago',
  },
];

function ActionCard({
  icon: Icon,
  title,
  description,
  href,
  external,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  href: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href as any}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="block group"
    >
      <Card className="hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer group-hover:-translate-y-1">
        <div className="flex items-center p-4 gap-4">
          <div className="p-3 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
            <Icon className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function Page() {
  const recentWorkspaces: RecentWorkspace[] = dummyWorkspaces;

  return (
    <div className="flex min-h-screen w-full bg-background selection:bg-primary/20">
      <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Branding & Actions */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <YasumuLogo className="size-12" />
                <h1 className="text-4xl font-bold tracking-tight">Yasumu</h1>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The ultimate API client for your projects. <br />
                Fast, reliable, and beautiful.
              </p>
              <YasumuRpcStatus />
            </div>

            <div className="flex flex-col gap-4">
              <ActionCard
                icon={FolderOpen}
                title="Open Workspace"
                description="Open existing or create a new Yasumu workspace from your file system."
                href="/"
              />
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                Community
              </h3>
              <div className="flex gap-4">
                <Link
                  href={YasumuSocials.GitHub as any}
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BsGithub className="size-4" />
                  GitHub
                </Link>
                <Link
                  href={YasumuSocials.Discord as any}
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BsDiscord className="size-4" />
                  Discord
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Workspaces */}
          <div className="lg:col-span-7">
            <Card className="h-full border-none shadow-none bg-transparent lg:bg-card lg:border lg:shadow-sm">
              <CardHeader className="px-0 lg:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Workspaces</CardTitle>
                </div>
                <CardDescription>
                  Continue working on your latest projects.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 lg:px-6">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {recentWorkspaces.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl">
                        <FolderOpen className="size-10 text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground font-medium">
                          No recent workspaces found
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Open a workspace to get started
                        </p>
                      </div>
                    ) : (
                      recentWorkspaces.map((workspace) => (
                        <div
                          key={workspace.id}
                          className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent hover:border-accent-foreground/10 transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-foreground group-hover:text-accent-foreground transition-colors">
                              {workspace.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                              {workspace.path}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            {workspace.lastOpened && (
                              <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                {workspace.lastOpened}
                              </span>
                            )}
                            <ArrowRight className="size-4 text-muted-foreground/50 group-hover:text-accent-foreground group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
