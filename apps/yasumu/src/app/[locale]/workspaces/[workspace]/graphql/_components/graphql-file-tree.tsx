'use client';

import { useQuery } from '@tanstack/react-query';
import type { GraphqlEntityCreateOptions, GraphqlTreeItem } from '@yasumu/core';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { Wand2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useActiveWorkspace, useYasumuRuntime } from '@/components/providers/workspace-provider';
import { FileTreeSidebar } from '@/components/sidebars/file-tree';
import LoadingScreen from '@/components/visuals/loading-screen';
import {
  findFolderInWorkspaceTree,
  flattenWorkspaceFolders,
  mapWorkspaceTreeToFileTree,
} from '@/components/workspace/file-tree-utils';
import { fileNamify } from '@/lib/utils/filenamify';

import { useFileTreeClipboardActions, useGraphqlFileTreeContext } from '../_providers/file-tree-context';
import { useGraphqlContext } from '../_providers/graphql-context';
import { GeneratorDialog } from './dialogs/generator-dialog';
import { GraphqlIcon } from './graphql-icon';

export function GraphqlFileTree() {
  const { yasumu } = useYasumuRuntime();
  const workspace = useActiveWorkspace();
  const { entityId, setEntityId, removeFromHistory } = useGraphqlContext();
  const { clipboard, clearClipboard, selectedFolderId, setSelectedFolderId } = useGraphqlFileTreeContext();
  const { handleFileCopy, handleFolderCopy, handleFileCut, handleFolderCut } = useFileTreeClipboardActions();

  const graphql = workspace.graphql;

  const {
    data: graphqlEntities,
    isLoading: isLoadingGraphqlEntities,
    refetch,
  } = useQuery({
    queryKey: ['graphqlEntities', workspace.id],
    queryFn: () => graphql?.listTree?.() ?? Promise.resolve([]),
    enabled: !!graphql,
  });

  const refetchGraphqlEntities = useCallback(() => {
    return refetch();
  }, [refetch]);

  const fileTree = useMemo(
    () =>
      mapWorkspaceTreeToFileTree(graphqlEntities ?? [], {
        folderFallbackName: 'New Folder',
        fileFallbackName: 'New Query',
        resolveFileIcon: () => GraphqlIcon,
      }),
    [graphqlEntities],
  );

  useEffect(() => {
    const controller = new AbortController();

    yasumu.events.on('onGraphqlEntityUpdate', refetchGraphqlEntities, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [yasumu.events, refetchGraphqlEntities]);

  const duplicateFile = useCallback(
    async (id: string) => {
      if (!graphql) return;
      const entity = await graphql.get(id);
      const data = entity.toJSON();
      await graphql.create({
        name: `${data.name} (copy)`,
        url: data.url,
        groupId: data.groupId,
        requestHeaders: data.requestHeaders,
        script: data.script,
        dependencies: data.dependencies,
        metadata: {},
        requestBody: data.requestBody,
        requestParameters: data.requestParameters,
        searchParameters: data.searchParameters,
      });
      await refetchGraphqlEntities();
    },
    [graphql, refetchGraphqlEntities],
  );

  const duplicateFolder = useCallback(
    async (id: string, targetParentId?: string | null) => {
      const folder = graphqlEntities ? findFolderInWorkspaceTree<GraphqlTreeItem>(graphqlEntities, id) : null;
      if (!folder || folder.type !== 'folder') return;

      const duplicateFolderRecursive = async (
        sourceFolder: GraphqlTreeItem,
        parentId: string | null,
      ): Promise<void> => {
        if (sourceFolder.type !== 'folder') return;

        const newFolder = await graphql.createEntityGroup({
          name: `${sourceFolder.name} (copy)`,
          parentId,
          entityType: 'graphql',
        });

        for (const child of sourceFolder.children ?? []) {
          if (child.type === 'file') {
            const entity = await graphql.get(child.id);
            const data = entity.toJSON();
            await graphql.create({
              name: data.name ?? 'New Query',
              url: data.url,
              groupId: newFolder.id,
              requestBody: data.requestBody,
              requestParameters: data.requestParameters,
              searchParameters: data.searchParameters,
              requestHeaders: data.requestHeaders,
              script: data.script,
              dependencies: data.dependencies,
              metadata: {},
            });
          } else {
            await duplicateFolderRecursive(child, newFolder.id);
          }
        }
      };

      await duplicateFolderRecursive(folder, targetParentId !== undefined ? targetParentId : (folder.parentId ?? null));

      await refetchGraphqlEntities();
    },
    [graphql, graphqlEntities, refetchGraphqlEntities],
  );

  const handlePaste = useCallback(
    async (targetFolderId: string | null) => {
      if (!clipboard) return;

      if (clipboard.operation === 'copy') {
        if (clipboard.type === 'file') {
          const entity = await graphql.get(clipboard.id);
          const data = entity.toJSON();
          await graphql.create({
            name: `${data.name} (copy)`,
            url: data.url,
            groupId: targetFolderId,
            requestBody: data.requestBody,
            requestParameters: data.requestParameters,
            searchParameters: data.searchParameters,
            requestHeaders: data.requestHeaders,
            script: data.script,
            dependencies: data.dependencies,
            metadata: {},
          });
        } else {
          await duplicateFolder(clipboard.id, targetFolderId);
        }
      } else if (clipboard.operation === 'cut') {
        if (clipboard.type === 'file') {
          await graphql.update(clipboard.id, {
            groupId: targetFolderId,
          });
        } else {
          await graphql.updateEntityGroup(clipboard.id, {
            parentId: targetFolderId,
          });
        }
        await refetchGraphqlEntities();
        clearClipboard();
      }
    },
    [clearClipboard, clipboard, duplicateFolder, graphql, refetchGraphqlEntities],
  );

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const folders = useMemo(() => flattenWorkspaceFolders(graphqlEntities ?? []), [graphqlEntities]);

  const handleGenerate = async (
    url: string,
    targetFolderId: string | null,
    operations: {
      name: string;
      content: string;
      operationName: string;
      type: 'query' | 'mutation' | 'subscription';
    }[],
  ) => {
    if (!graphql) return;

    // Create subfolders based on types
    const types = new Set(operations.map((op) => op.type));
    const folderMap: Record<string, string> = {}; // type -> folderId

    for (const type of types) {
      const folderName = (() => {
        switch (type) {
          case 'query':
            return 'Queries';
          case 'mutation':
            return 'Mutations';
          case 'subscription':
            return 'Subscriptions';
          default:
            return 'Others';
        }
      })();

      // Create folder
      const folder = await graphql.createEntityGroup({
        name: folderName,
        parentId: targetFolderId,
        entityType: 'graphql',
      });
      folderMap[type] = folder.id;
    }

    // Bulk create all operations at once
    const items: GraphqlEntityCreateOptions[] = operations.map((op) => {
      const operationName = fileNamify(op.name);
      return {
        name: operationName,
        url: url,
        groupId: folderMap[op.type],
        requestBody: {
          type: 'json',
          value: {
            query: op.content,
            variables: '{}',
            operationName,
          },
          metadata: {},
        },
        requestParameters: [],
        searchParameters: [],
        requestHeaders: [],
        metadata: {},
      };
    });

    await graphql.createBulk(items);

    await refetchGraphqlEntities();
  };

  if (isLoadingGraphqlEntities) {
    return <LoadingScreen fullScreen />;
  }

  return (
    <>
      <FileTreeSidebar
        stateKey={`${workspace.id}:graphql`}
        fileTree={fileTree}
        className="w-full font-sans"
        collapsible="none"
        enableFileSearch
        fileSearchPlaceholder="Search GraphQL operations..."
        clipboard={clipboard}
        selectedFileId={entityId}
        selectedFolderId={selectedFolderId}
        onFolderSelect={setSelectedFolderId}
        additionalToolbarItems={
          <button
            type="button"
            aria-label="Generate GraphQL operations"
            title="Generate GraphQL operations"
            className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring flex size-6 items-center justify-center rounded-sm outline-none focus-visible:ring-2"
            onClick={() => setIsGeneratorOpen(true)}
          >
            <Wand2 aria-hidden="true" className="size-3.5" />
          </button>
        }
        onFileSelect={withErrorHandler(async (id: string) => {
          setEntityId(id);
        })}
        onFileCreate={withErrorHandler(async (name: string, parentId?: string | null) => {
          await graphql?.create({
            name,
            url: null,
            groupId: parentId,
            requestBody: null,
            requestParameters: [],
            searchParameters: [],
            requestHeaders: [],
            metadata: {},
          });
        })}
        onFolderCreate={withErrorHandler(async (name: string, parentId?: string | null) => {
          await graphql?.createEntityGroup({
            name,
            parentId: parentId ?? null,
            entityType: 'graphql',
          });
        })}
        onFileDelete={withErrorHandler(async (id: string) => {
          await graphql?.delete(id);
          removeFromHistory(id);
        })}
        onFolderDelete={withErrorHandler(async (id: string) => {
          await graphql?.deleteEntityGroup(id);
        })}
        onFileRename={withErrorHandler(async (id: string, name: string) => {
          await graphql?.update(id, { name });
        })}
        onFolderRename={withErrorHandler(async (id: string, name: string) => {
          await graphql?.updateEntityGroup(id, { name });
        })}
        onFileDuplicate={withErrorHandler(duplicateFile)}
        onFolderDuplicate={withErrorHandler(duplicateFolder)}
        onFileCopy={handleFileCopy}
        onFolderCopy={handleFolderCopy}
        onFileCut={handleFileCut}
        onFolderCut={handleFolderCut}
        onPasteItem={withErrorHandler(handlePaste)}
        reloadTree={refetchGraphqlEntities}
      />
      <GeneratorDialog
        open={isGeneratorOpen}
        onOpenChange={setIsGeneratorOpen}
        folders={folders}
        onGenerate={handleGenerate}
      />
    </>
  );
}
