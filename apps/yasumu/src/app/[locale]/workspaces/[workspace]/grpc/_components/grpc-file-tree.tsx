'use client';
import { FileTreeSidebar } from '@/components/sidebars/file-tree';
import type { FileTreeItem } from '@/components/sidebars/file-tree';
import GrpcIconPrimitive from '@/components/visuals/grpc-icon';

const GrpcIcon = () => <GrpcIconPrimitive className="text-teal-600" />;

const FILE_TREE_ITEMS: FileTreeItem[] = [
  {
    id: 'grpc-user-service',
    name: 'UserService',
    type: 'folder',
    children: [
      {
        id: 'grpc-get-user',
        name: 'GetUser',
        icon: GrpcIcon,
        type: 'file',
      },
      {
        id: 'grpc-create-user',
        name: 'CreateUser',
        icon: GrpcIcon,
        type: 'file',
      },
      {
        id: 'grpc-update-user',
        name: 'UpdateUser',
        icon: GrpcIcon,
        type: 'file',
      },
      {
        id: 'grpc-delete-user',
        name: 'DeleteUser',
        icon: GrpcIcon,
        type: 'file',
      },
    ],
  },
  {
    id: 'grpc-product-service',
    name: 'ProductService',
    type: 'folder',
    children: [
      {
        id: 'grpc-list-products',
        name: 'ListProducts',
        icon: GrpcIcon,
        type: 'file',
      },
      {
        id: 'grpc-get-product',
        name: 'GetProduct',
        icon: GrpcIcon,
        type: 'file',
      },
    ],
  },
  {
    id: 'grpc-order-service',
    name: 'OrderService',
    type: 'folder',
    children: [
      {
        id: 'grpc-create-order',
        name: 'CreateOrder',
        icon: GrpcIcon,
        type: 'file',
      },
      {
        id: 'grpc-list-orders',
        name: 'ListOrders',
        icon: GrpcIcon,
        type: 'file',
      },
    ],
  },
];

export function GrpcFileTree() {
  return (
    <FileTreeSidebar
      fileTree={FILE_TREE_ITEMS}
      className="w-full font-sans"
      collapsible="none"
      onFileCreate={() => {}}
    />
  );
}
