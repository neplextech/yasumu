'use client';
import { useYasumu } from '@/providers/WorkspaceProvider';
import { WorkspaceModuleType, YasumuEntityTree, YasumuWorkspaceEvents } from '@yasumu/core';
import { useEffect, useState } from 'react';

export function useYasumuFileTree<T extends WorkspaceModuleType>(type: T): YasumuEntityTree<T>[] {
  const { yasumu } = useYasumu();
  const [tree, setTree] = useState<YasumuEntityTree<T>[]>([]);

  useEffect(() => {
    if (!yasumu.workspace) return;

    const fetchTree = async (modType: WorkspaceModuleType) => {
      if (!yasumu.workspace || type !== modType) return;

      const mod = yasumu.workspace.resolveModule(type);
      const tree = await mod.generateTree();

      setTree(tree.children as YasumuEntityTree<T>[]);
    };

    fetchTree(type).catch(console.error);

    yasumu.workspace.events.on(YasumuWorkspaceEvents.RebuildTree, fetchTree);

    return () => {
      yasumu.workspace?.events.off(YasumuWorkspaceEvents.RebuildTree, fetchTree);
    };
  }, [type, yasumu.workspace]);

  return tree;
}
