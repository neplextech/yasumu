'use client';
import React from 'react';
import ActionCard from './action-card';
import { FolderOpen } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useYasumu } from '@/components/providers/workspace-provider';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';

export default function OpenWorkspaceAction() {
  const { yasumu } = useYasumu();

  return (
    <ActionCard
      icon={FolderOpen}
      title="Open Workspace"
      description="Open existing or create a new Yasumu workspace from your file system."
      onClick={withErrorHandler(async () => {
        const folder = await open({
          canCreateDirectories: true,
          directory: true,
          multiple: false,
          title: 'Open Yasumu Workspace',
        });

        if (!folder) return;

        await yasumu.workspaces.create({
          name:
            folder.replaceAll('\\', '/').split('/').pop() ??
            'Untitled Workspace',
          metadata: {
            path: folder,
          },
        });
      })}
    />
  );
}
