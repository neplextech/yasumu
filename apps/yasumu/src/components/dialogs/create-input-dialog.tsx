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
import { Field, FieldError, FieldLabel } from '@yasumu/ui/components/field';
import { Input } from '@yasumu/ui/components/input';
import { useId, useRef, useState } from 'react';

type Props = React.PropsWithChildren<{
  title?: string;
  description?: string;
  defaultValue?: string;
  label?: string;
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
  label,
  submitLabel,
  cancelLabel,
  ...controlProps
}: Props) {
  const [open, setOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const isControlled = controlProps.open != undefined && controlProps.onOpenChange != undefined;
  const actualOpen = isControlled ? controlProps.open : open;

  function handleOpenChange(open: boolean) {
    if (!open) {
      setValidationError(null);
    }

    if (isControlled) controlProps.onOpenChange?.(open);
    else setOpen(open);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = inputRef.current?.value.trim() ?? '';
    if (!value) {
      setValidationError('Enter a name to continue.');
      inputRef.current?.focus();
      return;
    }

    onSubmit?.(value);
    handleOpenChange(false);
  }

  return (
    <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogTrigger
          type="button"
          aria-label={title ?? 'Open input dialog'}
          title={title}
          className="focus-visible:ring-ring inline-flex shrink-0 items-center justify-center rounded-sm text-inherit transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        >
          {children}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title ?? 'Enter a value'}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate>
          <Field className="py-4" data-invalid={validationError ? true : undefined}>
            <FieldLabel htmlFor={inputId}>{label ?? 'Name'}</FieldLabel>
            <Input
              ref={inputRef}
              id={inputId}
              defaultValue={defaultValue}
              autoFocus
              required
              aria-invalid={validationError ? true : undefined}
              aria-describedby={validationError ? errorId : undefined}
              onInput={() => setValidationError(null)}
            />
            {validationError ? <FieldError id={errorId}>{validationError}</FieldError> : null}
          </Field>
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
            <Button type="submit">{submitLabel ?? 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
