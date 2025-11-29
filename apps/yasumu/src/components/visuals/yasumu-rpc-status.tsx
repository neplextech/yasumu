'use client';
import { useYasumu } from '../providers/workspace-provider';
import { Badge } from '@yasumu/ui/components/badge';

export default function YasumuRpcStatus() {
  const { port } = useYasumu();

  return (
    <Badge variant="outline" className="rounded-full gap-2 pl-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      Connected to RPC on port <span className="font-bold">{port}</span>
    </Badge>
  );
}
