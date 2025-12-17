'use client';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import {
  DeleteMethodIcon,
  GetMethodIcon,
  PostMethodIcon,
  PutMethodIcon,
  resolveHttpMethodIcon,
} from './http-methods';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { useEffect, useEffectEvent, useState } from 'react';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';

export function RestFileTree() {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);

  const listWorkspaces = useEffectEvent(async () => {
    const entities = await workspace.rest.list();

    setFileTree(
      entities.map((entity) => ({
        name: entity.name ?? 'New Request',
        id: entity.id,
        icon: resolveHttpMethodIcon(entity.method),
      })),
    );
  });

  useEffect(() => {
    const controller = new AbortController();

    yasumu.events.on('onRestEntityUpdate', listWorkspaces, {
      signal: controller.signal,
    });

    void withErrorHandler(listWorkspaces)();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <FileTreeSidebar
      fileTree={fileTree}
      className="font-sans w-full"
      collapsible="none"
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
