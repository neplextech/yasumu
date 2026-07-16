'use client';
import { open } from '@tauri-apps/plugin-dialog';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { FolderOpen } from 'lucide-react';
import React from 'react';

import { useYasumuRuntime } from '@/components/providers/workspace-provider';

import ActionCard from './action-card';

export default function OpenWorkspaceAction() {
  const { yasumu } = useYasumuRuntime();

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
          name: folder.replaceAll('\\', '/').split('/').pop() ?? 'Untitled Workspace',
          metadata: {
            path: folder,
          },
        });
      })}
    />
  );
}
