'use client';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import {
  useEffect,
  useEffectEvent,
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { toast } from '@yasumu/ui/components/sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@yasumu/ui/components/alert-dialog';
import { Progress } from '@yasumu/ui/components/progress';
import { Copy, Loader2 } from 'lucide-react';
import { Button } from '@yasumu/ui/components/button';

type UpdatePhase = 'idle' | 'downloading' | 'installing' | 'complete' | 'error';

interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function UpdateDialog({
  update,
  phase,
  progress,
  error,
  onCancel,
  onContinue,
}: {
  update: Update;
  phase: UpdatePhase;
  progress: DownloadProgress;
  error: string | null;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const isUpdating = phase === 'downloading' || phase === 'installing';
  const canCancel = phase === 'idle' || phase === 'error';

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {phase === 'error'
              ? 'Update Failed'
              : phase === 'complete'
                ? 'Update Complete'
                : 'Update Available'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {phase === 'idle' && (
                <p>
                  A new version <strong>{update.version}</strong> of Yasumu is
                  available. You are currently on version{' '}
                  <strong>{update.currentVersion}</strong>.
                </p>
              )}

              {phase === 'downloading' && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading update...
                  </p>
                  <Progress value={progress.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatBytes(progress.downloaded)} /{' '}
                    {formatBytes(progress.total)} ({progress.percentage}%)
                  </p>
                </div>
              )}

              {phase === 'installing' && (
                <p className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Installing update... The application will restart shortly.
                </p>
              )}

              {phase === 'complete' && (
                <p>
                  Update installed successfully. The application will restart
                  now.
                </p>
              )}

              {phase === 'error' && (
                <div className="space-y-2">
                  <p className="text-destructive font-medium">
                    Failed to update
                  </p>
                  <div className="rounded-md bg-destructive/10 p-3 text-xs font-mono max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap break-all text-destructive">
                      {error ?? 'Unknown error occurred'}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(error ?? 'Unknown error');
                      toast.success('Error copied to clipboard');
                    }}
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy Error
                  </Button>
                </div>
              )}

              {update.body && phase === 'idle' && (
                <div className="mt-4 max-h-32 overflow-y-auto rounded-md bg-muted p-3 text-sm">
                  <p className="mb-1 font-medium">Release Notes:</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {update.body}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {canCancel && (
            <AlertDialogCancel onClick={onCancel} disabled={isUpdating}>
              {phase === 'error' ? 'Close' : 'Later'}
            </AlertDialogCancel>
          )}
          {phase === 'idle' && (
            <AlertDialogAction onClick={onContinue}>
              Update Now
            </AlertDialogAction>
          )}
          {phase === 'error' && (
            <AlertDialogAction onClick={onContinue}>Retry</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export interface UpdaterContextData {
  checkForUpdates: (showNotification?: boolean) => Promise<void>;
  isChecking: boolean;
}

const UpdaterContext = createContext<UpdaterContextData | null>(null);

export function useUpdater() {
  const context = useContext(UpdaterContext);

  if (!context) {
    throw new Error('useUpdater() must be used within a <UpdaterProvider />');
  }

  return context;
}

export default function UpdaterProvider({ children }: React.PropsWithChildren) {
  const [isChecking, setIsChecking] = useState(false);
  const [update, setUpdate] = useState<Update | null>(null);
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress>({
    downloaded: 0,
    total: 0,
    percentage: 0,
  });
  const downloadedRef = useRef(0);

  const checkForUpdates = useEffectEvent(async (showNotification = false) => {
    if (isChecking) return;

    setIsChecking(true);
    try {
      const result = await check({ allowDowngrades: false });

      if (!result) {
        if (showNotification) {
          toast.info('You are up to date!');
        }
        return;
      }

      setUpdate(result);
      setPhase('idle');
      setError(null);
      setProgress({ downloaded: 0, total: 0, percentage: 0 });
      downloadedRef.current = 0;
    } catch (err) {
      if (showNotification) {
        toast.error('Failed to check for updates');
      }
    } finally {
      setIsChecking(false);
    }
  });

  const handleCancelUpdate = useCallback(async () => {
    await update?.close();
    setUpdate(null);
    setPhase('idle');
    setError(null);
    setProgress({ downloaded: 0, total: 0, percentage: 0 });
    downloadedRef.current = 0;
  }, [update]);

  const handleContinueUpdate = useCallback(async () => {
    if (!update) return;

    setPhase('downloading');
    setError(null);
    downloadedRef.current = 0;
    let contentLength = 0;

    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength ?? 0;
            setProgress({
              downloaded: 0,
              total: contentLength,
              percentage: 0,
            });
            break;
          case 'Progress':
            downloadedRef.current += event.data.chunkLength;
            const total = contentLength || downloadedRef.current;
            const percentage = Math.min(
              Math.round((downloadedRef.current / total) * 100),
              100,
            );
            setProgress({
              downloaded: downloadedRef.current,
              total,
              percentage,
            });
            break;
          case 'Finished':
            setPhase('installing');
            break;
        }
      });

      setPhase('complete');
      toast.success('Update installed! Restarting...');

      await new Promise((resolve) => setTimeout(resolve, 1500));
      await relaunch();
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        message = `[Error] ${err.name}: ${err.message}`;
      } else if (typeof err === 'string') {
        message = `[String] ${err}`;
      } else if (err && typeof err === 'object') {
        try {
          message = `[Object] ${JSON.stringify(err, null, 2)}`;
        } catch {
          message = `[Object] ${String(err)}`;
        }
      } else {
        message = `[${typeof err}] ${String(err)}`;
      }
      setError(message);
      setPhase('error');
      toast.error('Update failed');
    }
  }, [update]);

  useEffect(() => {
    void checkForUpdates();
  }, []);

  return (
    <UpdaterContext.Provider value={{ checkForUpdates, isChecking }}>
      {update && (
        <UpdateDialog
          update={update}
          phase={phase}
          progress={progress}
          error={error}
          onCancel={handleCancelUpdate}
          onContinue={handleContinueUpdate}
        />
      )}
      {children}
    </UpdaterContext.Provider>
  );
}
