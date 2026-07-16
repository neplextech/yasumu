import { Button } from '@yasumu/ui/components/button';

interface InlineErrorBannerProps {
  message: React.ReactNode;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
}

export function InlineErrorBanner({ message, actionLabel, actionDisabled = false, onAction }: InlineErrorBannerProps) {
  return (
    <div role="alert" className="border-destructive/30 bg-destructive/5 flex items-center gap-3 border-y px-4 py-2">
      <p className="text-destructive min-w-0 flex-1 truncate text-sm">{message}</p>
      {actionLabel && onAction ? (
        <Button type="button" size="sm" variant="outline" disabled={actionDisabled} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
