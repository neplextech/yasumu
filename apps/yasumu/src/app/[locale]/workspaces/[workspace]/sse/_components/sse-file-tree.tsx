'use client';
import { SiServerless } from 'react-icons/si';

import { FileTreeSidebar } from '@/components/sidebars/file-tree';
import type { FileTreeItem } from '@/components/sidebars/file-tree';

const SSEIcon = () => <SiServerless className="text-blue-500" />;

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    id: 'sse-notifications',
    name: 'Notifications',
    type: 'folder',
    children: [
      {
        id: 'sse-notification-stream',
        name: 'Notification Stream',
        icon: SSEIcon,
        type: 'file',
      },
      {
        id: 'sse-alert-stream',
        name: 'Alert Stream',
        icon: SSEIcon,
        type: 'file',
      },
    ],
  },
  {
    id: 'sse-updates',
    name: 'Updates',
    type: 'folder',
    children: [
      {
        id: 'sse-live-updates',
        name: 'Live Updates',
        icon: SSEIcon,
        type: 'file',
      },
      {
        id: 'sse-status-stream',
        name: 'Status Stream',
        icon: SSEIcon,
        type: 'file',
      },
    ],
  },
  {
    id: 'sse-real-time-data',
    name: 'Real-time Data',
    type: 'folder',
    children: [
      {
        id: 'sse-data-stream',
        name: 'Data Stream',
        icon: SSEIcon,
        type: 'file',
      },
    ],
  },
];

export function SseFileTree() {
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="w-full font-sans"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
