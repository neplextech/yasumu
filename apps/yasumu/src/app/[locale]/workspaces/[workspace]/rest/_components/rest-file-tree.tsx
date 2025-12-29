'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import LoadingScreen from '@/components/visuals/loading-screen';
import { useRestContext } from '../_providers/rest-context';
import { resolveHttpMethodIcon } from './http-methods';

export function RestFileTree() {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const { setEntityId } = useRestContext();

  const {
    data: restEntities,
    isLoading: isLoadingRestEntities,
    refetch,
  } = useQuery({
    queryKey: ['restEntities'],
    queryFn: () => workspace.rest.listTree(),
  });

  console.log(restEntities, 'restEntities');

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
  }, [yasumu.events, refetchRestEntities]);

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
      }}
      onFileCreate={withErrorHandler(async (name: string) => {
        await workspace.rest.create({
          name,
          method: 'GET',
          url: null,
          metadata: {},
        });
      })}
      onFolderCreate={withErrorHandler(async () => {
        // Todo: Implement sub folder creation using parent id
        withErrorHandler(async (name: string) => {
          await workspace.rest.createEntityGroup({
            name,
          });
        });
      })}
      onFileDelete={withErrorHandler(async (id: string) => {
        await workspace.rest.delete(id);
      })}
      onFolderDelete={withErrorHandler(async () => {
        throw new Error('Folder deletion is not supported yet');
      })}
      onFileRename={withErrorHandler(async (id: string, name: string) => {
        await workspace.rest.update(id, { name });
      })}
      onFolderRename={withErrorHandler(async () => {
        throw new Error('Folder renaming is not supported yet');
      })}
    />
  );
}
