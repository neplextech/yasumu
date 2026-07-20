'use client';

import { Badge } from '@yasumu/ui/components/badge';
import { Button } from '@yasumu/ui/components/button';
import { Loader2 } from 'lucide-react';

import HttpMethodSelector from '@/app/[locale]/workspaces/[workspace]/rest/_components/http-methods-selector';
import { InteropableInput } from '@/components/inputs';

interface SseUrlBarProps {
  method: string;
  url: string;
  connected: boolean;
  active: boolean;
  isSaving: boolean;
  onMethodChange(method: string): void;
  onUrlChange(url: string): void;
  onConnect(): void;
  onDisconnect(): void;
  onVariableClick?(variableName: string): React.ReactNode;
}

export function SseUrlBar(props: SseUrlBarProps) {
  return (
    <div className="flex items-center gap-2">
      <HttpMethodSelector value={props.method} onChange={props.onMethodChange} />
      <div className="relative flex-1">
        <InteropableInput
          aria-label="SSE endpoint URL"
          placeholder="Enter an SSE endpoint URL"
          value={props.url}
          onChange={props.onUrlChange}
          onVariableClick={props.onVariableClick}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !props.active) {
              event.preventDefault();
              props.onConnect();
            }
          }}
          disabled={props.active}
          className="pr-8"
        />
        {props.isSaving ? (
          <div role="status" aria-label="Saving SSE changes" className="absolute top-1/2 right-2 -translate-y-1/2">
            <Loader2 aria-hidden="true" className="text-muted-foreground size-4 animate-spin" />
          </div>
        ) : null}
      </div>
      <Badge variant={props.connected ? 'default' : 'outline'}>{props.connected ? 'Connected' : 'Disconnected'}</Badge>
      {props.active ? (
        <Button type="button" variant="destructive" onClick={props.onDisconnect} className="min-w-[110px]">
          Disconnect
        </Button>
      ) : (
        <Button type="button" onClick={props.onConnect} disabled={!props.url.trim()} className="min-w-[110px]">
          Connect
        </Button>
      )}
    </div>
  );
}
