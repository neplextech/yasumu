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

export function CreateInputDialog({
  onCancel,
  onSubmit,
  children,
  description,
  title,
}: React.PropsWithChildren<{
  title?: string;
  description?: string;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
}>) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input ref={inputRef} />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setOpen(false);
              onCancel?.();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSubmit?.(inputRef.current?.value || '');
              setOpen(false);
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
