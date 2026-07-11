import { FolderOpen } from 'lucide-react';
import React from 'react';

export default function EmptyRecentWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-center">
      <FolderOpen className="text-muted-foreground/50 mb-3 size-10" />
      <p className="text-muted-foreground font-medium">No recent workspaces found</p>
      <p className="text-muted-foreground mt-1 text-xs">Open a workspace to get started</p>
    </div>
  );
}
