import { Badge } from '@yasumu/ui/components/badge';
import { Separator } from '@yasumu/ui/components/separator';
import { Clock, Database } from 'lucide-react';

interface ResponseStatusBarProps {
  status?: number;
  statusText?: string;
  time?: number | string;
  size?: number | string;
}

export function ResponseStatusBar({ status = 200, statusText = 'OK', time = 0, size }: ResponseStatusBarProps) {
  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300)
      return 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20';
    if (statusCode >= 300 && statusCode < 400)
      return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20';
    if (statusCode >= 400 && statusCode < 500)
      return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20';
    if (statusCode >= 500) return 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20';
    return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20';
  };

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex h-12 items-center gap-4 border-b px-4 backdrop-blur">
      {status && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getStatusColor(status)} font-mono font-normal`}>
            {status} {statusText}
          </Badge>
        </div>
      )}

      <Separator orientation="vertical" className="h-4" />

      {time !== undefined && (
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono">{time} ms</span>
        </div>
      )}

      {size && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Database className="h-3.5 w-3.5" />
            <span className="font-mono">{size}</span>
          </div>
        </>
      )}
    </div>
  );
}
