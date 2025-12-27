'use client';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import { resolveHttpMethodIcon } from './http-methods';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { useEffect, useEffectEvent, useState } from 'react';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { useRestContext } from '../_providers/rest-context';
import { useRestOutput } from '../_providers/rest-output';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '@/components/visuals/loading-screen';

export function RestFileTree() {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const { setEntityId } = useRestContext();
  const { setOutput } = useRestOutput();
  const {
    data: restEntities,
    isLoading: isLoadingRestEntities,
    refetch,
  } = useQuery({
    queryKey: ['restEntities'],
    queryFn: () => workspace.rest.list(),
  });

  const refetchRestEntities = useEffectEvent(() => {
    return refetch();
  });

  useEffect(() => {
    if (restEntities) {
      setFileTree(
        restEntities.map((entity) => ({
          name: entity.name ?? 'New Request',
          id: entity.id,
          icon: resolveHttpMethodIcon(entity.method),
        })),
      );
    }
  }, [restEntities]);

  useEffect(() => {
    const controller = new AbortController();

    yasumu.events.on('onRestEntityUpdate', refetchRestEntities, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, []);

  if (isLoadingRestEntities) {
    return <LoadingScreen fullScreen />;
  }

  return (
    <FileTreeSidebar
      fileTree={fileTree}
      className="font-sans w-full"
      collapsible="none"
      onFileSelect={(id: string) => {
        setEntityId(id);
        setOutput(null);
      }}
      onFileCreate={withErrorHandler(async (name: string) => {
        await workspace.rest.create({
          name,
          method: 'GET',
          url: null,
          metadata: {},
        });
      })}
      onFolderCreate={withErrorHandler(async (name: string) => {
        throw new Error('Folder creation is not supported yet');
      })}
      onFileDelete={withErrorHandler(async (id: string) => {
        await workspace.rest.delete(id);
      })}
      onFolderDelete={withErrorHandler(async (id: string) => {
        throw new Error('Folder deletion is not supported yet');
      })}
      onFileRename={withErrorHandler(async (id: string, name: string) => {
        await workspace.rest.update(id, {
          name,
        });
      })}
      onFolderRename={withErrorHandler(async (id: string, name: string) => {
        throw new Error('Folder renaming is not supported yet');
      })}
    />
  );
}
