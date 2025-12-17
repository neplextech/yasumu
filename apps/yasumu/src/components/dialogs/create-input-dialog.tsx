'use client';

import { Button } from '@yasumu/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@yasumu/ui/components/dialog';
import { Input } from '@yasumu/ui/components/input';
import { useRef, useState } from 'react';

type Props = React.PropsWithChildren<{
  title?: string;
  description?: string;
  defaultValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
}> &
  (
    | {
        open: boolean;
        onOpenChange: (open: boolean) => void;
      }
    | {
        open?: undefined;
        onOpenChange?: undefined;
      }
  );

export function CreateInputDialog({
  onCancel,
  onSubmit,
  children,
  description,
  title,
  defaultValue,
  submitLabel,
  cancelLabel,
  ...controlProps
}: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled =
    controlProps.open != undefined && controlProps.onOpenChange != undefined;
  const actualOpen = isControlled ? controlProps.open : open;

  function handleOpenChange(open: boolean) {
    if (isControlled) controlProps.onOpenChange?.(open);
    else setOpen(open);
  }

  return (
    <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input ref={inputRef} defaultValue={defaultValue} />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              handleOpenChange(false);
              onCancel?.();
            }}
          >
            {cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSubmit?.(inputRef.current?.value || '');
              handleOpenChange(false);
            }}
          >
            {submitLabel ?? 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
