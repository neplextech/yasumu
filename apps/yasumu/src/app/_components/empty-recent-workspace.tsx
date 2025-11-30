import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyRecentWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl">
      <FolderOpen className="size-10 text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground font-medium">
        No recent workspaces found
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Open a workspace to get started
      </p>
    </div>
  );
}
