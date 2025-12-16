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
import { useEffect, useState } from 'react';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    name: 'Authentication',
    children: [
      {
        name: 'Create Account',
        icon: PostMethodIcon,
      },
      {
        name: 'Login',
        icon: PostMethodIcon,
      },
      {
        name: 'Logout',
        icon: DeleteMethodIcon,
      },
      {
        name: 'Passwords',
        children: [
          {
            name: 'Forgot Password',
            icon: PostMethodIcon,
          },
          {
            name: 'Reset Password',
            icon: PostMethodIcon,
          },
        ],
      },
    ],
  },
  {
    name: 'Users',
    children: [
      {
        name: 'Get Users',
        icon: GetMethodIcon,
      },
      {
        name: 'Create User',
        icon: PostMethodIcon,
      },
      {
        name: 'Update User',
        icon: PutMethodIcon,
      },
      {
        name: 'Delete User',
        icon: DeleteMethodIcon,
      },
      {
        name: 'Get User by ID',
        icon: GetMethodIcon,
      },
    ],
  },
  {
    name: 'Posts',
    children: [
      {
        name: 'Get Posts',
        icon: GetMethodIcon,
      },
    ],
  },
  {
    name: 'Comments',
    children: [
      {
        name: 'Get Comments',
        icon: GetMethodIcon,
      },
    ],
  },
];

export function RestFileTree() {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    yasumu.events.on(
      'onRestEntityUpdate',
      async () => {
        const entities = await workspace.rest.list();

        setFileTree(
          entities.map((entity) => ({
            name: entity.name ?? 'New Request',
            id: entity.id,
            icon: resolveHttpMethodIcon(entity.method),
          })),
        );
      },
      {
        signal: controller.signal,
      },
    );

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
    />
  );
}
