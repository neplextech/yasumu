'use client';
import { FileTreeSidebar } from '@/components/sidebars/file-tree';

export function RestFileTree() {
  const resolveIcon = () => {
    return () => null;
  };

  return (
    <FileTreeSidebar
      fileTree={[]}
      className="font-sans w-full"
      collapsible="none"
      resolveIcon={resolveIcon}
      onFileCreate={() => {}}
    />
  );
}
