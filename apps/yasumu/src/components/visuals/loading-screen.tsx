'use client';
import { cn } from '@yasumu/ui/lib/utils';
import { CircleAlert, Loader2, RotateCw, Server } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface RpcDiscoveryStatus {
  attempt: number;
  maxAttempts: number;
  phase: 'discovering' | 'retrying';
  lastError?: string;
  retryAt?: number;
}

export interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
  rpcDiscovery?: RpcDiscoveryStatus;
}

function getRetryCountdown(retryAt?: number): number | null {
  if (!retryAt) return null;
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}

function RpcDiscoveryLoadingScreen({ status }: { status: RpcDiscoveryStatus }) {
  const [retryCountdown, setRetryCountdown] = useState(() => getRetryCountdown(status.retryAt));
  const isWaitingToRetry = status.phase === 'retrying' && retryCountdown !== null && retryCountdown > 0;
  const progress = Math.min((status.attempt / status.maxAttempts) * 100, 100);

  useEffect(() => {
    setRetryCountdown(getRetryCountdown(status.retryAt));

    if (!status.retryAt) return;

    const timer = window.setInterval(() => {
      setRetryCountdown(getRetryCountdown(status.retryAt));
    }, 250);

    return () => window.clearInterval(timer);
  }, [status.retryAt]);

  const phaseCopy = isWaitingToRetry
    ? `Retrying in ${retryCountdown} second${retryCountdown === 1 ? '' : 's'}`
    : status.phase === 'retrying'
      ? `Retry ${status.attempt} of ${status.maxAttempts} is connecting`
      : 'Looking for the local Yasumu runtime';

  return (
    <div className="bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--muted))_0%,transparent_55%)] opacity-70" />
      <div className="border-border/80 bg-card/80 relative w-full max-w-md rounded-2xl border p-7 shadow-2xl shadow-black/10 backdrop-blur-sm">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div className="border-primary/20 bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl border">
            <Server className="size-5" aria-hidden="true" />
          </div>
          <div className="border-border bg-background/70 text-muted-foreground flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
            <Loader2 className="text-primary size-3.5 animate-spin" aria-hidden="true" />
            Starting services
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">Yasumu is starting</p>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Connecting your workspace</h1>
          <p className="text-muted-foreground text-sm leading-6">
            Yasumu is waiting for its local RPC service before opening your workspace.
          </p>
        </div>

        <div className="border-border bg-muted/35 mt-7 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-background text-primary flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
              {status.phase === 'retrying' ? (
                <RotateCw className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-foreground text-sm font-medium">{phaseCopy}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Attempt {status.attempt} of {status.maxAttempts}
              </p>
            </div>
          </div>
          <div className="bg-border/80 mt-4 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {status.lastError && (
          <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-200">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">The RPC service is not ready yet</p>
              <p className="mt-1 text-xs leading-5 break-words opacity-80">{status.lastError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoadingScreen({ fullScreen, message, rpcDiscovery }: LoadingScreenProps) {
  if (rpcDiscovery) {
    return <RpcDiscoveryLoadingScreen status={rpcDiscovery} />;
  }

  return (
    <div className={cn('flex items-center justify-center', fullScreen && 'h-screen w-full overflow-hidden')}>
      <div className="flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={48} />
        {message && <p className="text-center text-sm">{message}</p>}
      </div>
    </div>
  );
}
