'use client';
import { FileTreeSidebar } from '@/components/sidebars/FileTreeSidebar';
import { useYasumuFileTree } from '@/hooks/use-yasumu-file-tree';
import { handleErrorToast } from '@/lib/handlers/handleErrorToast';
import { useYasumu } from '@/providers/WorkspaceProvider';
import { isSseEntityTree, WorkspaceModuleType, YasumuEntityTree } from '@yasumu/core';
import { Zap } from 'lucide-react';

export function SSEFileTree() {
  const { yasumu } = useYasumu();
  const tree = useYasumuFileTree(WorkspaceModuleType.SSE);

  const resolveIcon = (entity: YasumuEntityTree<WorkspaceModuleType>) => {
    if (!isSseEntityTree(entity)) return () => null;

    // eslint-disable-next-line react/display-name
    return () => <Zap />;
  };

  const handleFileCreate = handleErrorToast(async (name: string) => {
    if (!yasumu.workspace) return;

    await yasumu.workspace.sse.create({ name });
  });

  return (
    <FileTreeSidebar
      fileTree={tree}
      className="font-sans w-full"
      collapsible="none"
      resolveIcon={resolveIcon}
      onFileCreate={handleFileCreate}
    />
  );
}
