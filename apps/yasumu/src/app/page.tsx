'use client';

import YasumuLogo from '@/components/visuals/yasumu-logo';
import YasumuRpcStatus from '@/app/_components/yasumu-rpc-status';
import Community from './_components/community';
import RecentWorkspaces from './_components/recent-workspaces';
import OpenWorkspaceAction from './_components/open-workspace-action';
import { Button } from '@yasumu/ui/components/button';
import { Cog } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex min-h-screen w-full bg-background selection:bg-primary/20 relative">
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
      <div className="absolute bottom-12 left-12">
        <Link href="/en/settings">
          <Button variant="outline" size="icon">
            <Cog className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
