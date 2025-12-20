import { Badge } from '@yasumu/ui/components/badge';

interface ResponseStatusBarProps {
  status?: number;
  statusText?: string;
  time?: number | string;
}

export function ResponseStatusBar({
  status = 200,
  statusText = 'OK',
  time = 0,
}: ResponseStatusBarProps) {
  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500';
    if (statusCode >= 300 && statusCode < 400) return 'bg-blue-500';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-500';
    if (statusCode >= 500) return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b">
      {status && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge className={`${getStatusColor(status)} text-white`}>
            {status} {statusText}
          </Badge>
        </div>
      )}
      {time !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time:</span>
          <span className="text-sm font-medium">{time} ms</span>
        </div>
      )}
    </div>
  );
}
