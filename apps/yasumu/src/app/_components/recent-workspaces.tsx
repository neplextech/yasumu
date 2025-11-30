'use client';
import React, { useEffect, useState } from 'react';
import EmptyRecentWorkspace from './empty-recent-workspace';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@yasumu/ui/components/card';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import RecentWorkspaceCard, { RecentWorkspace } from './recent-workspace-card';
import { useYasumu } from '@/components/providers/workspace-provider';

export default function RecentWorkspaces() {
  const { yasumu } = useYasumu();
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>(
    [],
  );

  useEffect(() => {
    const fetchRecentWorkspaces = async () => {
      const workspaces = await yasumu.workspaces.list({ take: 5 });
      setRecentWorkspaces(
        workspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          path: workspace.path,
          lastOpenedAt: workspace.lastOpenedAt,
        })),
      );
    };

    fetchRecentWorkspaces();
  }, []);

  return (
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
              <EmptyRecentWorkspace />
            ) : (
              recentWorkspaces.map((workspace) => (
                <RecentWorkspaceCard key={workspace.id} workspace={workspace} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
