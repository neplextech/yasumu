'use client';
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '../ui/sidebar';
import { Check, FolderInput } from 'lucide-react';
import Link from 'next/link';
import { useYasumu } from '@/providers/WorkspaceProvider';
import { CreateInputDialog } from '../dialogs/CreateInputDialog';
import { handleErrorToast } from '@/lib/handlers/handleErrorToast';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export function EnvironmentSidebar(
  props: React.ComponentProps<typeof Sidebar>,
) {
  const { yasumu, environments, selectedEnvironmentId } = useYasumu();
  const router = useRouter();
  const params = useSearchParams();

  const createEnvironment = handleErrorToast(async (name: string) => {
    const env = await yasumu.workspace?.environments.createEnvironment({
      name,
    });
    if (!env) return;

    toast.success('Environment added!', {
      description: `The environment "${env.name}" has been added to the workspace.`,
    });

    router.push(`/environment?env=${env.id}`);
  });

  const currentEnvId = params.get('env');

  return (
    <Sidebar collapsible="none" {...props}>
      <SidebarContent className="zw-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex justify-between w-full">
              <div>Environments</div>
              <div className="flex items-center gap-2">
                <CreateInputDialog
                  title="Create new environment"
                  description="Add a new environment to this workspace."
                  onSubmit={createEnvironment}
                  onCancel={() => {}}
                >
                  <FolderInput className="h-[0.9rem] w-[0.9rem] cursor-pointer hover:bg-zinc-700" />
                </CreateInputDialog>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {environments.map((env) => {
                return (
                  <Link
                    key={env.id}
                    href={{
                      pathname: '/environment',
                      query: { env: env.id },
                    }}
                    className={cn(
                      'flex flex-col items-start gap-2 whitespace-nowrap p-2 text-sm leading-tight hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      'inline-flex flex-row items-center gap-2',
                      {
                        'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/40':
                          env.id === currentEnvId,
                      },
                    )}
                  >
                    <Check
                      className={cn('size-4', {
                        'text-green-500': selectedEnvironmentId === env.id,
                        'text-muted-foreground':
                          selectedEnvironmentId !== env.id,
                      })}
                    />
                    <span className="text-foreground">{env.name}</span>
                  </Link>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
