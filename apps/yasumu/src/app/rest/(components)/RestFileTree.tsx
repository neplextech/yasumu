'use client';
import {
  DeleteMethodIcon,
  GetMethodIcon,
  PatchMethodIcon,
  PostMethodIcon,
  PutMethodIcon,
  HeadMethodIcon,
  OptionsMethodIcon,
} from '@/components/assets/HttpMethods';
import { FileTreeSidebar } from '@/components/sidebars/FileTreeSidebar';
import { useYasumuFileTree } from '@/hooks/use-yasumu-file-tree';
import { handleErrorToast } from '@/lib/handlers/handleErrorToast';
import { useYasumu } from '@/providers/WorkspaceProvider';
import { HttpMethod, isRestEntityTree, RestIndex, WorkspaceModuleType, YasumuEntityTree } from '@yasumu/core';

export function RestFileTree() {
  const { yasumu } = useYasumu();
  const tree = useYasumuFileTree(WorkspaceModuleType.Rest);

  const resolveIcon = (entity: YasumuEntityTree<WorkspaceModuleType>) => {
    if (!isRestEntityTree(entity)) return () => null;

    switch ((entity as unknown as RestIndex).method) {
      case HttpMethod.Get:
        return GetMethodIcon;
      case HttpMethod.Post:
        return PostMethodIcon;
      case HttpMethod.Put:
        return PutMethodIcon;
      case HttpMethod.Patch:
        return PatchMethodIcon;
      case HttpMethod.Delete:
        return DeleteMethodIcon;
      case HttpMethod.Head:
        return HeadMethodIcon;
      case HttpMethod.Options:
        return OptionsMethodIcon;
      default:
        return () => null;
    }
  };

  const handleFileCreate = handleErrorToast(async (name: string) => {
    if (!yasumu.workspace) return;

    await yasumu.workspace.rest.create({ name });
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
