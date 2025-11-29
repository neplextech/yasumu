'use client';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import {
  DeleteMethodIcon,
  GetMethodIcon,
  PostMethodIcon,
  PutMethodIcon,
} from './http-methods';

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
        name: 'Forgot Password',
        icon: PostMethodIcon,
      },
      {
        name: 'Reset Password',
        icon: PostMethodIcon,
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
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="font-sans w-full"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
