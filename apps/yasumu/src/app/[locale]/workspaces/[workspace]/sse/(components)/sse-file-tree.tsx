'use client';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import { SiServerless } from 'react-icons/si';

const SSEIcon = () => <SiServerless className="text-blue-500" />;

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    name: 'Notifications',
    children: [
      {
        name: 'Notification Stream',
        icon: SSEIcon,
      },
      {
        name: 'Alert Stream',
        icon: SSEIcon,
      },
    ],
  },
  {
    name: 'Updates',
    children: [
      {
        name: 'Live Updates',
        icon: SSEIcon,
      },
      {
        name: 'Status Stream',
        icon: SSEIcon,
      },
    ],
  },
  {
    name: 'Real-time Data',
    children: [
      {
        name: 'Data Stream',
        icon: SSEIcon,
      },
    ],
  },
];

export function SseFileTree() {
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="font-sans w-full"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
