'use client';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import { SiSocketdotio } from 'react-icons/si';

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    name: 'Chat',
    children: [
      {
        name: 'Join Room',
        icon: SiSocketdotio,
      },
      {
        name: 'Send Message',
        icon: SiSocketdotio,
      },
      {
        name: 'Leave Room',
        icon: SiSocketdotio,
      },
    ],
  },
  {
    name: 'Notifications',
    children: [
      {
        name: 'Subscribe',
        icon: SiSocketdotio,
      },
      {
        name: 'Unsubscribe',
        icon: SiSocketdotio,
      },
    ],
  },
  {
    name: 'Real-time Updates',
    children: [
      {
        name: 'Listen to Updates',
        icon: SiSocketdotio,
      },
    ],
  },
];

export function SocketioFileTree() {
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="font-sans w-full"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
