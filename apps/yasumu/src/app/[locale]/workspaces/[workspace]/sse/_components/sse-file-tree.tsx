'use client';

import { useQuery } from '@tanstack/react-query';
import type { SseTreeItem } from '@yasumu/core';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { useCallback, useEffect, useMemo } from 'react';

import { useActiveWorkspace, useYasumuRuntime } from '@/components/providers/workspace-provider';
import { FileTreeSidebar } from '@/components/sidebars/file-tree';
import LoadingScreen from '@/components/visuals/loading-screen';
import { findFolderInWorkspaceTree, mapWorkspaceTreeToFileTree } from '@/components/workspace/file-tree-utils';

import { useFileTreeClipboardActions, useSseFileTreeContext } from '../_providers/file-tree-context';
import { useSseContext } from '../_providers/sse-context';
import { SseIcon } from './sse-icon';

export function SseFileTree() {
  const { yasumu } = useYasumuRuntime();
  const workspace = useActiveWorkspace();
  const { entityId, setEntityId, removeFromHistory } = useSseContext();
  const { clipboard, clearClipboard, selectedFolderId, setSelectedFolderId } = useSseFileTreeContext();
  const { handleFileCopy, handleFolderCopy, handleFileCut, handleFolderCut } = useFileTreeClipboardActions();
  const {
    data: entities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['sseEntities', workspace.id],
    queryFn: () => workspace.sse.listTree(),
  });

  const reload = useCallback(() => refetch(), [refetch]);
  const fileTree = useMemo(
    () =>
      mapWorkspaceTreeToFileTree(entities ?? [], {
        folderFallbackName: 'New Folder',
        fileFallbackName: 'New Stream',
        resolveFileIcon: () => SseIcon,
      }),
    [entities],
  );

  useEffect(() => {
    const controller = new AbortController();
    yasumu.events.on('onSseEntityUpdate', reload, { signal: controller.signal });
    return () => controller.abort();
  }, [reload, yasumu.events]);

  const createCopy = useCallback(
    async (id: string, groupId?: string | null, suffix = true) => {
      const data = (await workspace.sse.get(id)).toJSON();
      await workspace.sse.create({
        name: `${data.name ?? 'New Stream'}${suffix ? ' (copy)' : ''}`,
        method: data.method,
        url: data.url,
        groupId: groupId === undefined ? data.groupId : groupId,
        requestParameters: data.requestParameters,
        searchParameters: data.searchParameters,
        requestHeaders: data.requestHeaders,
        requestBody: data.requestBody,
        eventTypes: data.eventTypes,
        reconnect: data.reconnect,
        script: data.script,
        testScript: data.testScript,
        dependencies: data.dependencies,
        metadata: {},
      });
    },
    [workspace.sse],
  );

  const duplicateFolder = useCallback(
    async (id: string, targetParentId?: string | null) => {
      const folder = entities ? findFolderInWorkspaceTree<SseTreeItem>(entities, id) : null;
      if (!folder || folder.type !== 'folder') return;

      const duplicateRecursively = async (source: SseTreeItem, parentId: string | null): Promise<void> => {
        if (source.type !== 'folder') return;
        const copy = await workspace.sse.createEntityGroup({
          name: `${source.name} (copy)`,
          parentId,
          entityType: 'sse',
        });
        for (const child of source.children ?? []) {
          if (child.type === 'file') await createCopy(child.id, copy.id, false);
          else await duplicateRecursively(child, copy.id);
        }
      };

      await duplicateRecursively(folder, targetParentId !== undefined ? targetParentId : folder.parentId);
      await reload();
    },
    [createCopy, entities, reload, workspace.sse],
  );

  const handlePaste = useCallback(
    async (targetFolderId: string | null) => {
      if (!clipboard) return;
      if (clipboard.operation === 'copy') {
        if (clipboard.type === 'file') await createCopy(clipboard.id, targetFolderId);
        else await duplicateFolder(clipboard.id, targetFolderId);
      } else if (clipboard.type === 'file') {
        await workspace.sse.update(clipboard.id, { groupId: targetFolderId });
        clearClipboard();
      } else {
        await workspace.sse.updateEntityGroup(clipboard.id, { parentId: targetFolderId });
        clearClipboard();
      }
      await reload();
    },
    [clearClipboard, clipboard, createCopy, duplicateFolder, reload, workspace.sse],
  );

  if (isLoading) return <LoadingScreen fullScreen />;

  return (
    <FileTreeSidebar
      stateKey={`${workspace.id}:sse`}
      fileTree={fileTree}
      className="w-full font-sans"
      collapsible="none"
      enableFileSearch
      fileSearchPlaceholder="Search SSE streams..."
      clipboard={clipboard}
      selectedFileId={entityId}
      selectedFolderId={selectedFolderId}
      onFolderSelect={setSelectedFolderId}
      onFileSelect={withErrorHandler(async (id) => setEntityId(id))}
      onFileCreate={withErrorHandler(async (name, parentId) => {
        await workspace.sse.create({
          name,
          method: 'GET',
          url: null,
          groupId: parentId,
          reconnect: { enabled: true, retryMs: 3000 },
          metadata: {},
        });
      })}
      onFolderCreate={withErrorHandler(async (name, parentId) => {
        await workspace.sse.createEntityGroup({ name, parentId: parentId ?? null, entityType: 'sse' });
      })}
      onFileDelete={withErrorHandler(async (id) => {
        await workspace.sse.delete(id);
        removeFromHistory(id);
      })}
      onFolderDelete={withErrorHandler((id) => workspace.sse.deleteEntityGroup(id))}
      onFileRename={withErrorHandler((id, name) => workspace.sse.update(id, { name }))}
      onFolderRename={withErrorHandler((id, name) => workspace.sse.updateEntityGroup(id, { name }))}
      onFileDuplicate={withErrorHandler(async (id) => {
        await createCopy(id);
        await reload();
      })}
      onFolderDuplicate={withErrorHandler(duplicateFolder)}
      onFileCopy={handleFileCopy}
      onFolderCopy={handleFolderCopy}
      onFileCut={handleFileCut}
      onFolderCut={handleFolderCut}
      onPasteItem={withErrorHandler(handlePaste)}
      reloadTree={reload}
    />
  );
}
