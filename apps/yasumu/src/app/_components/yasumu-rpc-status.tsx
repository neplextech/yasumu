'use client';
import { Badge } from '@yasumu/ui/components/badge';

import { useYasumuRuntime } from '@/components/providers/workspace-provider';

export default function YasumuRpcStatus() {
  const { port } = useYasumuRuntime();

  return (
    <Badge variant="outline" className="gap-2 rounded-full pl-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
      </span>
      Connected to RPC on port <span className="font-bold">{port}</span>
    </Badge>
  );
}
