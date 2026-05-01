'use client';

import { useCallback, useEffect, useEffectEvent, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileTreeSidebar } from '@/components/sidebars/file-tree';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import LoadingScreen from '@/components/visuals/loading-screen';
import { useRestContext } from '../_providers/rest-context';
import {
  useFileTreeClipboardActions,
  useFileTreeContext,
} from '../_providers/file-tree-context';
import { resolveHttpMethodIcon } from './http-methods';
import type { RestTreeItem } from '@yasumu/core';
import {
  findFolderInWorkspaceTree,
  mapWorkspaceTreeToFileTree,
} from '@/components/workspace/file-tree-utils';

export function RestFileTree() {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const { setEntityId, removeFromHistory } = useRestContext();
  const { clipboard, clearClipboard, selectedFolderId, setSelectedFolderId } =
    useFileTreeContext();
  const { handleFileCopy, handleFolderCopy, handleFileCut, handleFolderCut } =
    useFileTreeClipboardActions();

  const {
    data: restEntities,
    isLoading: isLoadingRestEntities,
    refetch,
  } = useQuery({
    queryKey: ['restEntities', workspace.id],
    queryFn: () => workspace.rest.listTree(),
  });

  const refetchRestEntities = useEffectEvent(() => {
    return refetch();
  });

  const fileTree = useMemo(
    () =>
      mapWorkspaceTreeToFileTree(restEntities ?? [], {
        folderFallbackName: 'New Folder',
        fileFallbackName: 'New Request',
        resolveFileIcon: (item) =>
          resolveHttpMethodIcon(item.method, { short: false }),
      }),
    [restEntities],
  );

  useEffect(() => {
    const controller = new AbortController();

    yasumu.events.on('onRestEntityUpdate', refetchRestEntities, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [yasumu.events, refetchRestEntities]);

  const duplicateFile = useCallback(
    async (id: string) => {
      const entity = await workspace.rest.get(id);
      const data = entity.toJSON();
      await workspace.rest.create({
        name: `${data.name} (copy)`,
        method: data.method,
        url: data.url,
        groupId: data.groupId,
        requestParameters: data.requestParameters,
        searchParameters: data.searchParameters,
        requestHeaders: data.requestHeaders,
        requestBody: data.requestBody,
        script: data.script,
        dependencies: data.dependencies,
        metadata: {},
      });
      await refetchRestEntities();
    },
    [workspace.rest],
  );

  const duplicateFolder = useCallback(
    async (id: string, targetParentId?: string | null) => {
      const folder = restEntities
        ? findFolderInWorkspaceTree<RestTreeItem>(restEntities, id)
        : null;
      if (!folder || folder.type !== 'folder') return;

      const duplicateFolderRecursive = async (
        sourceFolder: RestTreeItem,
        parentId: string | null,
      ): Promise<void> => {
        if (sourceFolder.type !== 'folder') return;

        const newFolder = await workspace.rest.createEntityGroup({
          name: `${sourceFolder.name} (copy)`,
          parentId,
          entityType: 'rest',
        });

        for (const child of sourceFolder.children ?? []) {
          if (child.type === 'file') {
            const entity = await workspace.rest.get(child.id);
            const data = entity.toJSON();
            await workspace.rest.create({
              name: data.name ?? 'New Request',
              method: data.method,
              url: data.url,
              groupId: newFolder.id,
              requestParameters: data.requestParameters,
              searchParameters: data.searchParameters,
              requestHeaders: data.requestHeaders,
              requestBody: data.requestBody,
              script: data.script,
              dependencies: data.dependencies,
              metadata: {},
            });
          } else {
            await duplicateFolderRecursive(child, newFolder.id);
          }
        }
      };

      await duplicateFolderRecursive(
        folder,
        targetParentId !== undefined ? targetParentId : folder.parentId,
      );

      await refetchRestEntities();
    },
    [workspace.rest, restEntities],
  );

  const handlePaste = useCallback(
    async (targetFolderId: string | null) => {
      if (!clipboard) return;

      if (clipboard.operation === 'copy') {
        if (clipboard.type === 'file') {
          const entity = await workspace.rest.get(clipboard.id);
          const data = entity.toJSON();
          await workspace.rest.create({
            name: `${data.name} (copy)`,
            method: data.method,
            url: data.url,
            groupId: targetFolderId,
            requestParameters: data.requestParameters,
            searchParameters: data.searchParameters,
            requestHeaders: data.requestHeaders,
            requestBody: data.requestBody,
            script: data.script,
            dependencies: data.dependencies,
            metadata: {},
          });
        } else {
          await duplicateFolder(clipboard.id, targetFolderId);
        }
      } else if (clipboard.operation === 'cut') {
        if (clipboard.type === 'file') {
          await workspace.rest.update(clipboard.id, {
            groupId: targetFolderId,
          });
        } else {
          await workspace.rest.updateEntityGroup(clipboard.id, {
            parentId: targetFolderId,
          });
        }
        await refetchRestEntities();
        clearClipboard();
      }
    },
    [clipboard, workspace.rest, duplicateFolder, clearClipboard],
  );

  if (isLoadingRestEntities) {
    return <LoadingScreen fullScreen />;
  }

  return (
    <FileTreeSidebar
      fileTree={fileTree}
      className="font-sans w-full"
      collapsible="none"
      clipboard={clipboard}
      selectedFolderId={selectedFolderId}
      onFolderSelect={setSelectedFolderId}
      onFileSelect={withErrorHandler(async (id: string) => {
        setEntityId(id);
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
      onFileDuplicate={withErrorHandler(duplicateFile)}
      onFolderDuplicate={withErrorHandler(duplicateFolder)}
      onFileCopy={handleFileCopy}
      onFolderCopy={handleFolderCopy}
      onFileCut={handleFileCut}
      onFolderCut={handleFolderCut}
      onPasteItem={withErrorHandler(handlePaste)}
      reloadTree={refetchRestEntities}
    />
  );
}
