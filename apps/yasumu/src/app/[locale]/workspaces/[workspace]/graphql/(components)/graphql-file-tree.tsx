'use client';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import { GraphqlIcon } from './graphql-icon';

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    name: 'Users',
    children: [
      {
        name: 'Get Users',
        icon: GraphqlIcon,
      },
      {
        name: 'Get User by ID',
        icon: GraphqlIcon,
      },
      {
        name: 'Create User',
        icon: GraphqlIcon,
      },
    ],
  },
  {
    name: 'Posts',
    children: [
      {
        name: 'Get Posts',
        icon: GraphqlIcon,
      },
      {
        name: 'Create Post',
        icon: GraphqlIcon,
      },
    ],
  },
  {
    name: 'Comments',
    children: [
      {
        name: 'Get Comments',
        icon: GraphqlIcon,
      },
    ],
  },
];

export function GraphqlFileTree() {
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="font-sans w-full"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
