'use client';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import WebSocketIcon from '@/components/visuals/websocket-icon';

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    name: 'Chat',
    children: [
      {
        name: 'Chat Connection',
        icon: WebSocketIcon,
      },
      {
        name: 'Group Chat',
        icon: WebSocketIcon,
      },
    ],
  },
  {
    name: 'Real-time Data',
    children: [
      {
        name: 'Stock Prices',
        icon: WebSocketIcon,
      },
      {
        name: 'Live Updates',
        icon: WebSocketIcon,
      },
    ],
  },
  {
    name: 'Notifications',
    children: [
      {
        name: 'Push Notifications',
        icon: WebSocketIcon,
      },
    ],
  },
];

export function WebsocketFileTree() {
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="font-sans w-full"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
