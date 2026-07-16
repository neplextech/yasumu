'use client';

import { Button } from '@yasumu/ui/components/button';
import { Loader2 } from 'lucide-react';

import { InteropableInput } from '@/components/inputs';

import HttpMethodSelector from '../http-methods-selector';

interface RequestUrlBarProps {
  method: string;
  url: string;
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onVariableClick?: (variableName: string) => React.ReactNode;
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
  onVariableClick,
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
    <div className="flex items-center gap-2">
      <HttpMethodSelector onChange={onMethodChange} value={method} />
      <div className="relative flex-1">
        <InteropableInput
          aria-label="Request URL"
          placeholder="Enter a URL (e.g., https://api.example.com/users)"
          value={url}
          onChange={onUrlChange}
          onKeyDown={handleKeyDown}
          onVariableClick={onVariableClick}
          className="pr-8"
          disabled={isSending}
        />
        {isSaving ? (
          <div role="status" aria-label="Saving request changes" className="absolute top-1/2 right-2 -translate-y-1/2">
            <Loader2 aria-hidden="true" className="text-muted-foreground size-4 animate-spin" />
          </div>
        ) : null}
      </div>
      {isSending ? (
        <Button type="button" onClick={onCancel} variant="destructive" className="min-w-[100px]">
          Cancel
        </Button>
      ) : (
        <Button type="button" onClick={onSend} disabled={!url.trim()} className="min-w-[100px]">
          Send
        </Button>
      )}
    </div>
  );
}
