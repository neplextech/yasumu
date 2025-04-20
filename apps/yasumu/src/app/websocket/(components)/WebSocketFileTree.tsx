'use client';
import WebSocketLogo from '@/components/assets/WebSocketLogo';
import { FileTreeSidebar } from '@/components/sidebars/FileTreeSidebar';
import { useYasumuFileTree } from '@/hooks/use-yasumu-file-tree';
import { handleErrorToast } from '@/lib/handlers/handleErrorToast';
import { useYasumu } from '@/providers/WorkspaceProvider';
import {
  isWebsocketEntityTree,
  WorkspaceModuleType,
  YasumuEntityTree,
} from '@yasumu/core';

export function WebSocketFileTree() {
  const { yasumu } = useYasumu();
  const tree = useYasumuFileTree(WorkspaceModuleType.Websocket);

  const resolveIcon = (entity: YasumuEntityTree<WorkspaceModuleType>) => {
    if (!isWebsocketEntityTree(entity)) return () => null;

    // eslint-disable-next-line react/display-name
    return () => <WebSocketLogo />;
  };

  const handleFileCreate = handleErrorToast(async (name: string) => {
    if (!yasumu.workspace) return;

    await yasumu.workspace.websocket.create({ name });
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
