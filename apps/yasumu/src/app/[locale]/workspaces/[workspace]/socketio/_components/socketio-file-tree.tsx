'use client';
import { SiSocketdotio } from 'react-icons/si';

import { FileTreeSidebar } from '@/components/sidebars/file-tree';
import type { FileTreeItem } from '@/components/sidebars/file-tree';

const SocketIoIcon = () => <SiSocketdotio />;

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    id: 'socketio-chat',
    name: 'Chat',
    type: 'folder',
    children: [
      {
        id: 'socketio-join-room',
        name: 'Join Room',
        icon: SocketIoIcon,
        type: 'file',
      },
      {
        id: 'socketio-send-message',
        name: 'Send Message',
        icon: SocketIoIcon,
        type: 'file',
      },
      {
        id: 'socketio-leave-room',
        name: 'Leave Room',
        icon: SocketIoIcon,
        type: 'file',
      },
    ],
  },
  {
    id: 'socketio-notifications',
    name: 'Notifications',
    type: 'folder',
    children: [
      {
        id: 'socketio-subscribe',
        name: 'Subscribe',
        icon: SocketIoIcon,
        type: 'file',
      },
      {
        id: 'socketio-unsubscribe',
        name: 'Unsubscribe',
        icon: SocketIoIcon,
        type: 'file',
      },
    ],
  },
  {
    id: 'socketio-real-time-updates',
    name: 'Real-time Updates',
    type: 'folder',
    children: [
      {
        id: 'socketio-listen-to-updates',
        name: 'Listen to Updates',
        icon: SocketIoIcon,
        type: 'file',
      },
    ],
  },
];

export function SocketioFileTree() {
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="w-full font-sans"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
