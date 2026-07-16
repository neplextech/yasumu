'use client';

import { Button } from '@yasumu/ui/components/button';
import { Loader2 } from 'lucide-react';

import { InteropableInput } from '@/components/inputs';

import IntrospectButton from '../introspect-button';

interface GraphqlUrlBarProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onIntrospect?: () => void;
  onVariableClick?: (variableName: string) => React.ReactNode;
  isSending?: boolean;
  isSaving?: boolean;
  isIntrospecting?: boolean;
}

export function GraphqlUrlBar({
  url,
  onUrlChange,
  onSend,
  onCancel,
  onIntrospect,
  onVariableClick,
  isSending,
  isSaving,
  isIntrospecting,
}: GraphqlUrlBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSending) {
      e.preventDefault();
      onSend();
    }
  };

  const isLoading = isSending || isIntrospecting;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <InteropableInput
          aria-label="GraphQL endpoint URL"
          placeholder="Enter GraphQL endpoint URL (e.g., https://api.example.com/graphql)"
          value={url}
          onChange={onUrlChange}
          onKeyDown={handleKeyDown}
          onVariableClick={onVariableClick}
          className="pr-8"
          disabled={isLoading}
        />
        {isSaving ? (
          <div role="status" aria-label="Saving GraphQL changes" className="absolute top-1/2 right-2 -translate-y-1/2">
            <Loader2 aria-hidden="true" className="text-muted-foreground size-4 animate-spin" />
          </div>
        ) : null}
      </div>
      {onIntrospect && (
        <IntrospectButton onClick={onIntrospect} disabled={!url.trim() || isLoading} isLoading={isIntrospecting} />
      )}
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
