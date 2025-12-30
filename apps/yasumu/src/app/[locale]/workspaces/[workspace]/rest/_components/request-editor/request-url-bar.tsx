'use client';

import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import { Loader2 } from 'lucide-react';
import HttpMethodSelector from '../http-methods-selector';

interface RequestUrlBarProps {
  method: string;
  url: string;
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isSending?: boolean;
  isSaving?: boolean;
}

export function RequestUrlBar({
  method,
  url,
  onMethodChange,
  onUrlChange,
  onSend,
  onCancel,
  isSending,
  isSaving,
}: RequestUrlBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSending) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <HttpMethodSelector onChange={onMethodChange} value={method} />
      <div className="flex-1 relative">
        <Input
          placeholder="Enter a URL (e.g., https://api.example.com/users)"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="font-mono text-sm pr-8"
          disabled={isSending}
        />
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {isSending ? (
        <Button
          onClick={onCancel}
          variant="destructive"
          className="min-w-[100px]"
        >
          Cancel
        </Button>
      ) : (
        <Button
          onClick={onSend}
          disabled={!url.trim()}
          className="min-w-[100px]"
        >
          Send
        </Button>
      )}
    </div>
  );
}
