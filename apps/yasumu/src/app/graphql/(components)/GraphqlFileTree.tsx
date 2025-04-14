'use client';
import { FileTreeSidebar } from '@/components/sidebars/FileTreeSidebar';
import { useYasumuFileTree } from '@/hooks/use-yasumu-file-tree';
import { handleErrorToast } from '@/lib/handlers/handleErrorToast';
import { useYasumu } from '@/providers/WorkspaceProvider';
import { isGraphqlEntityTree, WorkspaceModuleType, YasumuEntityTree } from '@yasumu/core';
import { SiGraphql } from 'react-icons/si';

export function GraphqlFileTree() {
  const { yasumu } = useYasumu();
  const tree = useYasumuFileTree(WorkspaceModuleType.GraphQL);

  const resolveIcon = (entity: YasumuEntityTree<WorkspaceModuleType>) => {
    if (!isGraphqlEntityTree(entity)) return () => null;

    // eslint-disable-next-line react/display-name
    return () => <SiGraphql className="text-pink-500" />;
  };

  const handleFileCreate = handleErrorToast(async (name: string) => {
    if (!yasumu.workspace) return;

    await yasumu.workspace.graphql.create({ name });
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
