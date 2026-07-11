'use client';
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
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { VscWarning } from 'react-icons/vsc';

import { PermissionPromptEvent } from '../providers/permission-prompt-provider';

export function PermissionPrompt({
  onConfirm,
  event,
}: {
  event: PermissionPromptEvent;
  onConfirm: (prompt: PermissionPromptEvent, response: PermissionPromptEvent['prompt']['response']) => void;
}) {
  const { prompt } = event;
  const hasStack = prompt.stack.length > 0;

  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent className="w-5xl" autoWidth>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <VscWarning className="size-4" />
            <span>
              Script requests <span className="font-mono text-sm">{`--allow-${prompt.name}`}</span> permission
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="text-foreground wrap-break-words font-medium">Script wants {prompt.message}</div>

              {prompt.api_name && (
                <div className="text-muted-foreground text-xs">
                  Requested by{' '}
                  <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{prompt.api_name}</code> API.
                </div>
              )}

              {hasStack && (
                <div className="space-y-2">
                  <div className="text-muted-foreground text-sm font-medium">Stack trace:</div>
                  <ScrollArea className="bg-muted/50 h-48 w-full rounded-md border p-3">
                    <div className="space-y-1 font-mono text-xs">
                      {prompt.stack.map((frame, idx) => (
                        <div key={idx} className="text-muted-foreground wrap-break-words">
                          at {frame}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onConfirm(event, 'Deny')}>Deny</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(event, 'Allow')}>Allow</AlertDialogAction>
          {prompt.is_unary && (
            <AlertDialogAction onClick={() => onConfirm(event, 'AllowAll')}>Allow All</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
