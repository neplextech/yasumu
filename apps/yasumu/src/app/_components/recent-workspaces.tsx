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
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '@/components/visuals/loading-screen';

export default function RecentWorkspaces() {
  const { yasumu } = useYasumu();
  const { data: recentWorkspaces, isLoading } = useQuery({
    queryKey: ['recent-workspaces'],
    queryFn: async () => {
      const workspaces = await yasumu.workspaces.list({ take: 5 });
      return workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        path: workspace.path,
        lastOpenedAt: workspace.lastOpenedAt,
      }));
    },
  });

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
            {isLoading ? (
              <LoadingScreen />
            ) : recentWorkspaces?.length === 0 ? (
              <EmptyRecentWorkspace />
            ) : (
              recentWorkspaces?.map((workspace) => (
                <RecentWorkspaceCard key={workspace.id} workspace={workspace} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
