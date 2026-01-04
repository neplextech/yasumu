'use client';

import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import LoadingScreen from '@/components/visuals/loading-screen';
import { useRestContext } from '../_providers/rest-context';
import { useFileTreeContext } from '../_providers/file-tree-context';
import { resolveHttpMethodIcon } from './http-methods';
import type { RestTreeItem } from '@yasumu/common';

export function RestFileTree() {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const { setEntityId, removeFromHistory } = useRestContext();
  const {
    clipboard,
    setClipboard,
    clearClipboard,
    selectedFolderId,
    setSelectedFolderId,
  } = useFileTreeContext();

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
      return {
        id: item.id,
        name: item.name ?? 'New Request',
        type: 'file',
        icon: resolveHttpMethodIcon(item.method, { short: false }),
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
        testScript: data.testScript,
        dependencies: data.dependencies,
        metadata: {},
      });
    },
    [workspace.rest],
  );

  const duplicateFolder = useCallback(
    async (id: string, targetParentId?: string | null) => {
      const findFolderInTree = (
        items: RestTreeItem[],
        folderId: string,
      ): RestTreeItem | null => {
        for (const item of items) {
          if (item.id === folderId) return item;
          if (item.type === 'folder' && item.children) {
            const found = findFolderInTree(item.children, folderId);
            if (found) return found;
          }
        }
        return null;
      };

      const folder = restEntities ? findFolderInTree(restEntities, id) : null;
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
              testScript: data.testScript,
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
    },
    [workspace.rest, restEntities],
  );

  const handleFileCopy = useCallback(
    (id: string) => {
      setClipboard({ id, type: 'file', operation: 'copy' });
    },
    [setClipboard],
  );

  const handleFolderCopy = useCallback(
    (id: string) => {
      setClipboard({ id, type: 'folder', operation: 'copy' });
    },
    [setClipboard],
  );

  const handleFileCut = useCallback(
    (id: string) => {
      setClipboard({ id, type: 'file', operation: 'cut' });
    },
    [setClipboard],
  );

  const handleFolderCut = useCallback(
    (id: string) => {
      setClipboard({ id, type: 'folder', operation: 'cut' });
    },
    [setClipboard],
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
            testScript: data.testScript,
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
      onFileDuplicate={withErrorHandler(duplicateFile)}
      onFolderDuplicate={withErrorHandler(duplicateFolder)}
      onFileCopy={handleFileCopy}
      onFolderCopy={handleFolderCopy}
      onFileCut={handleFileCut}
      onFolderCut={handleFolderCut}
      onPasteItem={withErrorHandler(handlePaste)}
    />
  );
}
