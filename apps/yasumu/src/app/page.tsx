'use client';

import { Button } from '@yasumu/ui/components/button';
import { Cog } from 'lucide-react';
import Link from 'next/link';

import YasumuRpcStatus from '@/app/_components/yasumu-rpc-status';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import YasumuLogo from '@/components/visuals/yasumu-logo';

import Community from './_components/community';
import OpenWorkspaceAction from './_components/open-workspace-action';
import RecentWorkspaces from './_components/recent-workspaces';

export default function Page() {
  const workspace = useActiveWorkspace(false);

  return (
    <div className="bg-background selection:bg-primary/20 relative flex min-h-screen w-full">
      <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-1 flex-col items-center justify-center p-8 duration-500">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Branding & Actions */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <YasumuLogo className="size-12" />
                <h1 className="text-4xl font-bold tracking-tight">Yasumu</h1>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">
                The ultimate API client for your projects. <br />
                Fast, reliable, and beautiful.
              </p>
              <YasumuRpcStatus />
            </div>

            <div className="flex flex-col gap-4">
              <OpenWorkspaceAction />
            </div>

            <Community />
          </div>

          {/* Right Column: Recent Workspaces */}
          <div className="lg:col-span-7">
            <RecentWorkspaces />
          </div>
        </div>
      </div>
      {!workspace && (
        <div className="absolute bottom-12 left-12">
          <Link href="/en/settings">
            <Button variant="outline" size="icon">
              <Cog className="size-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
