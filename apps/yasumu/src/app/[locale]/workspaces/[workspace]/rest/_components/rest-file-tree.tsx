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
import type { RestTreeItem } from '@yasumu/common';

export function RestFileTree() {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const { setEntityId, removeFromHistory } = useRestContext();

  const {
    data: restEntities,
    isLoading: isLoadingRestEntities,
    refetch,
  } = useQuery({
    queryKey: ['restEntities'],
    queryFn: () => workspace.rest.listTree(),
  });

  const refetchRestEntities = useEffectEvent(() => {
    return refetch();
  });

  // Recursively map tree items to FileTreeItem structure
  const mapTreeToFileTree = (items: RestTreeItem[]): FileTreeItem[] => {
    return items.map((item): FileTreeItem => {
      if (item.type === 'folder') {
        return {
          id: item.id,
          name: item.name ?? 'New Folder',
          type: 'folder',
          children: mapTreeToFileTree(item.children ?? []),
        };
      }
      // File (REST request)
      return {
        id: item.id,
        name: item.name ?? 'New Request',
        type: 'file',
        icon: resolveHttpMethodIcon(item.method),
      };
    });
  };

  useEffect(() => {
    if (restEntities) {
      setFileTree(mapTreeToFileTree(restEntities));
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
      onFileSelect={withErrorHandler(async (id: string) => {
        setEntityId(id);
        await workspace.rest.upsertHistory(id);
      })}
      onFileCreate={withErrorHandler(
        async (name: string, parentId?: string | null) => {
          await workspace.rest.create({
            name,
            method: 'GET',
            url: null,
            groupId: parentId,
            metadata: {},
          });
        },
      )}
      onFolderCreate={withErrorHandler(
        async (name: string, parentId?: string | null) => {
          await workspace.rest.createEntityGroup({
            name,
            parentId: parentId ?? null,
            entityType: 'rest',
          });
        },
      )}
      onFileDelete={withErrorHandler(async (id: string) => {
        await workspace.rest.delete(id);
        removeFromHistory(id);
      })}
      onFolderDelete={withErrorHandler(async (id: string) => {
        await workspace.rest.deleteEntityGroup(id);
      })}
      onFileRename={withErrorHandler(async (id: string, name: string) => {
        await workspace.rest.update(id, { name });
      })}
      onFolderRename={withErrorHandler(async (id: string, name: string) => {
        await workspace.rest.updateEntityGroup(id, { name });
      })}
    />
  );
}
