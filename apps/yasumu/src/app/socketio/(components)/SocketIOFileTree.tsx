'use client';
import { FileTreeSidebar } from '@/components/sidebars/FileTreeSidebar';
import { useYasumuFileTree } from '@/hooks/use-yasumu-file-tree';
import { handleErrorToast } from '@/lib/handlers/handleErrorToast';
import { useYasumu } from '@/providers/WorkspaceProvider';
import { isSocketioEntityTree, WorkspaceModuleType, YasumuEntityTree } from '@yasumu/core';
import { SiSocketdotio } from 'react-icons/si';

export function SocketIOFileTree() {
  const { yasumu } = useYasumu();
  const tree = useYasumuFileTree(WorkspaceModuleType.SocketIO);

  const resolveIcon = (entity: YasumuEntityTree<WorkspaceModuleType>) => {
    if (!isSocketioEntityTree(entity)) return () => null;

    // eslint-disable-next-line react/display-name
    return () => <SiSocketdotio />;
  };

  const handleFileCreate = handleErrorToast(async (name: string) => {
    if (!yasumu.workspace) return;

    await yasumu.workspace.socketio.create({ name });
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
