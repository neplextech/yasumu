'use client';

import { Alert, AlertDescription, AlertTitle } from '@yasumu/ui/components/alert';
import { Button } from '@yasumu/ui/components/button';
import { Info, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export const SSE_REST_ALERT_DISMISSED_KEY = 'sse-rest-alert-dismissed';

interface SseRestAlertProps {
  onOpenSse: () => Promise<unknown>;
}

function readDismissedPreference(): boolean {
  try {
    return window.localStorage.getItem(SSE_REST_ALERT_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistDismissedPreference(): void {
  try {
    window.localStorage.setItem(SSE_REST_ALERT_DISMISSED_KEY, 'true');
  } catch {
    // A restricted storage context should not prevent the hint from closing.
  }
}

export function SseRestAlert({ onOpenSse }: SseRestAlertProps) {
  const [storageChecked, setStorageChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isOpeningSse, setIsOpeningSse] = useState(false);

  useEffect(() => {
    setDismissed(readDismissedPreference());
    setStorageChecked(true);
  }, []);

  if (!storageChecked || dismissed) return null;

  const handleOpenSse = async () => {
    setIsOpeningSse(true);
    try {
      await onOpenSse();
    } finally {
      setIsOpeningSse(false);
    }
  };

  const handleDismiss = () => setDismissed(true);

  const handleDontShowAgain = () => {
    persistDismissedPreference();
    setDismissed(true);
  };

  return (
    <Alert className="relative mx-3 mt-3 shrink-0 border-blue-500/30 bg-blue-500/5 pr-10">
      <Info className="text-blue-500" aria-hidden="true" />
      <AlertTitle>SSE response detected</AlertTitle>
      <AlertDescription>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>
            This endpoint returned an SSE response. REST can show captured events, but it does not stay connected.
          </span>
          <span>Try</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 font-semibold text-blue-600 dark:text-blue-400"
            onClick={() => void handleOpenSse()}
            disabled={isOpeningSse}
          >
            {isOpeningSse ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
            SSE
          </Button>
          <span>for continuous event handling.</span>
          <Button type="button" variant="ghost" size="sm" className="h-auto px-1.5" onClick={handleDontShowAgain}>
            Don&apos;t show again
          </Button>
        </div>
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground absolute top-2 right-2 size-7"
        aria-label="Dismiss SSE response hint"
        onClick={handleDismiss}
      >
        <X aria-hidden="true" />
      </Button>
    </Alert>
  );
}
