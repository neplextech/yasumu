'use client';
import { FileTreeSidebar } from '@/components/sidebars/file-tree';
import type { FileTreeItem } from '@/components/sidebars/file-tree';
import WebSocketIcon from '@/components/visuals/websocket-icon';

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    id: 'websocket-chat',
    name: 'Chat',
    type: 'folder',
    children: [
      {
        id: 'websocket-chat-connection',
        name: 'Chat Connection',
        icon: WebSocketIcon,
        type: 'file',
      },
      {
        id: 'websocket-group-chat',
        name: 'Group Chat',
        icon: WebSocketIcon,
        type: 'file',
      },
    ],
  },
  {
    id: 'websocket-real-time-data',
    name: 'Real-time Data',
    type: 'folder',
    children: [
      {
        id: 'websocket-stock-prices',
        name: 'Stock Prices',
        icon: WebSocketIcon,
        type: 'file',
      },
      {
        id: 'websocket-live-updates',
        name: 'Live Updates',
        icon: WebSocketIcon,
        type: 'file',
      },
    ],
  },
  {
    id: 'websocket-notifications',
    name: 'Notifications',
    type: 'folder',
    children: [
      {
        id: 'websocket-push-notifications',
        name: 'Push Notifications',
        icon: WebSocketIcon,
        type: 'file',
      },
    ],
  },
];

export function WebsocketFileTree() {
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="w-full font-sans"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
