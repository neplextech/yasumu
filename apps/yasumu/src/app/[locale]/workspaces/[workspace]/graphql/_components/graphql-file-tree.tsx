'use client';

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import LoadingScreen from '@/components/visuals/loading-screen';
import { useGraphqlContext } from '../_providers/graphql-context';
import { useGraphqlFileTreeContext } from '../_providers/file-tree-context';
import { GeneratorDialog } from './dialogs/generator-dialog';
import { Wand2 } from 'lucide-react';
import { GraphqlIcon } from './graphql-icon';
import { fileNamify } from '@/lib/utils/filenamify';

// GraphQL tree item type (will be provided by core API)
interface GraphqlTreeItem {
  id: string;
  name: string | null;
  type: 'file' | 'folder';
  parentId?: string | null;
  children?: GraphqlTreeItem[];
}

export function GraphqlFileTree() {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const { setEntityId, removeFromHistory } = useGraphqlContext();
  const {
    clipboard,
    setClipboard,
    clearClipboard,
    selectedFolderId,
    setSelectedFolderId,
  } = useGraphqlFileTreeContext();

  const graphql = workspace.graphql;

  const {
    data: graphqlEntities,
    isLoading: isLoadingGraphqlEntities,
    refetch,
  } = useQuery({
    queryKey: ['graphqlEntities'],
    queryFn: () => graphql?.listTree?.() ?? Promise.resolve([]),
    enabled: !!graphql,
  });

  const refetchGraphqlEntities = useEffectEvent(() => {
    return refetch();
  });

  const mapTreeToFileTree = (items: GraphqlTreeItem[]): FileTreeItem[] => {
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
        name: item.name ?? 'New Query',
        type: 'file',
        icon: GraphqlIcon,
      };
    });
  };

  const fileTree = useMemo(() => {
    if (!graphqlEntities) return [];
    return mapTreeToFileTree(graphqlEntities as GraphqlTreeItem[]);
  }, [graphqlEntities]);

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
    [graphql],
  );

  const duplicateFolder = useCallback(
    async (id: string, targetParentId?: string | null) => {
      const findFolderInTree = (
        items: GraphqlTreeItem[],
        folderId: string,
      ): GraphqlTreeItem | null => {
        for (const item of items) {
          if (item.id === folderId) return item;
          if (item.type === 'folder' && item.children) {
            const found = findFolderInTree(item.children, folderId);
            if (found) return found;
          }
        }
        return null;
      };

      const folder = graphqlEntities
        ? findFolderInTree(graphqlEntities as GraphqlTreeItem[], id)
        : null;
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

      await duplicateFolderRecursive(
        folder,
        targetParentId !== undefined
          ? targetParentId
          : (folder.parentId ?? null),
      );

      await refetchGraphqlEntities();
    },
    [graphql, graphqlEntities],
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
    [clipboard, graphql, duplicateFolder, clearClipboard],
  );

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const flattenFolders = useCallback(
    (
      items: GraphqlTreeItem[],
      depth = 0,
    ): { id: string; name: string; parentId?: string | null }[] => {
      let result: { id: string; name: string; parentId?: string | null }[] = [];
      for (const item of items) {
        if (item.type === 'folder') {
          result.push({
            id: item.id,
            name: item.name ?? 'Untitled Folder',
            parentId: item.parentId,
          });
          if (item.children) {
            result.push(...flattenFolders(item.children, depth + 1));
          }
        }
      }
      return result;
    },
    [],
  );

  const folders = graphqlEntities
    ? flattenFolders(graphqlEntities as GraphqlTreeItem[])
    : [];

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
    const items = operations.map((op) => {
      const operationName = fileNamify(op.name);
      return {
        name: operationName,
        url: url,
        groupId: folderMap[op.type],
        requestBody: {
          type: 'json' as const,
          value: {
            query: op.content,
            variables: '{}',
            operationName,
          },
          metadata: {},
        },
        requestParameters: [] as any[],
        searchParameters: [] as any[],
        requestHeaders: [] as any[],
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
        fileTree={fileTree}
        className="font-sans w-full"
        collapsible="none"
        clipboard={clipboard}
        selectedFolderId={selectedFolderId}
        onFolderSelect={setSelectedFolderId}
        additionalToolbarItems={
          <button onClick={() => setIsGeneratorOpen(true)}>
            <Wand2 className="h-[0.9rem] w-[0.9rem] cursor-pointer hover:bg-zinc-700" />
          </button>
        }
        onFileSelect={withErrorHandler(async (id: string) => {
          setEntityId(id);
          await graphql?.upsertHistory(id);
        })}
        onFileCreate={withErrorHandler(
          async (name: string, parentId?: string | null) => {
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
          },
        )}
        onFolderCreate={withErrorHandler(
          async (name: string, parentId?: string | null) => {
            await graphql?.createEntityGroup({
              name,
              parentId: parentId ?? null,
              entityType: 'graphql',
            });
          },
        )}
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
