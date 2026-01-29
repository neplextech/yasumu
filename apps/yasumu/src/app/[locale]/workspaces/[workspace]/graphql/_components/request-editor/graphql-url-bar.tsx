'use client';

import { Button } from '@yasumu/ui/components/button';
import { Loader2 } from 'lucide-react';
import { InteropableInput } from '@/components/inputs';

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
    <div className="flex gap-2 items-center">
      <div className="flex-1 relative">
        <InteropableInput
          placeholder="Enter GraphQL endpoint URL (e.g., https://api.example.com/graphql)"
          value={url}
          onChange={onUrlChange}
          onKeyDown={handleKeyDown}
          onVariableClick={onVariableClick}
          className="pr-8"
          disabled={isLoading}
        />
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {onIntrospect && (
        <Button
          onClick={onIntrospect}
          variant="outline"
          disabled={!url.trim() || isLoading}
          className="min-w-[100px]"
        >
          {isIntrospecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Introspect'
          )}
        </Button>
      )}
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
