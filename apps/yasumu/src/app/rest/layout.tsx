import { FileTreeSidebar } from '@/components/sidebars/file-tree-sidebar';
import LayoutGroup from '@/components/layout-group';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  DeleteMethodIcon,
  GetMethodIcon,
  PatchMethodIcon,
  PostMethodIcon,
  PutMethodIcon,
} from '@/components/assets/HttpMethods';
const restData = [
  {
    name: 'Account',
    children: [
      {
        name: 'Authenticate',
        children: [
          {
            name: 'Login',
            icon: PostMethodIcon,
          },
          {
            name: 'Logout',
            icon: PostMethodIcon,
          },
          {
            name: 'Register',
            icon: PostMethodIcon,
          },
        ],
      },
      {
        name: 'Current user',
        icon: GetMethodIcon,
      },
      {
        name: 'Update current user',
        icon: PatchMethodIcon,
      },
    ],
  },
  {
    name: 'Comments',
    children: [
      {
        name: 'List comments',
        icon: GetMethodIcon,
      },
      {
        name: 'Create comment',
        icon: PostMethodIcon,
      },
      {
        name: 'Update comment',
        icon: PutMethodIcon,
      },
      {
        name: 'Delete comment',
        icon: DeleteMethodIcon,
      },
    ],
  },
  {
    name: 'Users',
    children: [
      {
        name: 'List users',
        icon: GetMethodIcon,
      },
      {
        name: 'Create user',
        icon: PostMethodIcon,
      },
      {
        name: 'Update user',
        icon: PutMethodIcon,
      },
      {
        name: 'Delete user',
        icon: DeleteMethodIcon,
      },
    ],
  },
  {
    name: 'Todo lists',
    children: [
      {
        name: 'List todos',
        icon: GetMethodIcon,
      },
      {
        name: 'Create todo',
        icon: PostMethodIcon,
      },
      {
        name: 'Update todo',
        icon: PutMethodIcon,
      },
      {
        name: 'Delete todo',
        icon: DeleteMethodIcon,
      },
    ],
  },
  {
    name: 'Health check',
    icon: GetMethodIcon,
  },
  {
    name: 'Ping',
    icon: GetMethodIcon,
  },
];

export default function RestLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <ResizablePanelGroup direction="horizontal" autoSaveId="yasumu-rest-layout">
        <ResizablePanel defaultSize={17}>
          <FileTreeSidebar fileTree={restData} className="font-sans w-full" collapsible="none" />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          <ResizablePanelGroup direction="vertical" autoSaveId="yasumu-rest-layout-2">
            <ResizablePanel>{children}</ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <div className="flex items-center justify-center h-full">output</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </LayoutGroup>
  );
}
