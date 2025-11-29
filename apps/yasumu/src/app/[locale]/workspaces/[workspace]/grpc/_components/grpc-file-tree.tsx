'use client';
import { FileTreeItem, FileTreeSidebar } from '@/components/sidebars/file-tree';
import GrpcIconPrimitive from '@/components/visuals/grpc-icon';

const GrpcIcon = () => <GrpcIconPrimitive className="text-teal-600" />;

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    name: 'UserService',
    children: [
      {
        name: 'GetUser',
        icon: GrpcIcon,
      },
      {
        name: 'CreateUser',
        icon: GrpcIcon,
      },
      {
        name: 'UpdateUser',
        icon: GrpcIcon,
      },
      {
        name: 'DeleteUser',
        icon: GrpcIcon,
      },
    ],
  },
  {
    name: 'ProductService',
    children: [
      {
        name: 'ListProducts',
        icon: GrpcIcon,
      },
      {
        name: 'GetProduct',
        icon: GrpcIcon,
      },
    ],
  },
  {
    name: 'OrderService',
    children: [
      {
        name: 'CreateOrder',
        icon: GrpcIcon,
      },
      {
        name: 'ListOrders',
        icon: GrpcIcon,
      },
    ],
  },
];

export function GrpcFileTree() {
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="font-sans w-full"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
