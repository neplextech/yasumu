'use client';

import type { CookieSameSite, WorkspaceCookie, WorkspaceCookieInput } from '@yasumu/core';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@yasumu/ui/components/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@yasumu/ui/components/field';
import { Input } from '@yasumu/ui/components/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { Spinner } from '@yasumu/ui/components/spinner';
import { useState, type FormEvent } from 'react';

interface CookieDraft {
  name: string;
  value: string;
  domain: string;
  path: string;
  expiresAt: string;
  secure: boolean;
  httpOnly: boolean;
  hostOnly: boolean;
  sameSite: CookieSameSite;
}

interface CookieEditorDialogProps {
  cookie: WorkspaceCookie | null;
  pending: boolean;
  onClose(): void;
  onSave(input: WorkspaceCookieInput): Promise<void>;
}

export function CookieEditorDialog({ cookie, pending, onClose, onSave }: CookieEditorDialogProps) {
  const [draft, setDraft] = useState<CookieDraft>(() => draftFromCookie(cookie));
  const [serverError, setServerError] = useState<string | null>(null);
  const errors = validateDraft(draft);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.keys(errors).length) return;
    setServerError(null);
    try {
      await onSave({
        id: cookie?.id,
        name: draft.name,
        value: draft.value,
        domain: draft.domain,
        path: draft.path,
        expiresAt: draft.expiresAt ? new Date(draft.expiresAt).getTime() : null,
        secure: draft.secure,
        httpOnly: draft.httpOnly,
        hostOnly: draft.hostOnly,
        sameSite: draft.sameSite,
      });
      onClose();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Failed to save the cookie');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{cookie ? 'Edit cookie' : 'Add cookie'}</DialogTitle>
            <DialogDescription>
              Stored only in this workspace. Domain, path, expiry, and security rules control when it is sent.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="cookie-name">Name</FieldLabel>
                <Input
                  id="cookie-name"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  aria-invalid={!!errors.name}
                  autoComplete="off"
                />
                <FieldError>{errors.name}</FieldError>
              </Field>
              <Field data-invalid={!!errors.domain}>
                <FieldLabel htmlFor="cookie-domain">Domain</FieldLabel>
                <Input
                  id="cookie-domain"
                  value={draft.domain}
                  onChange={(event) => setDraft((current) => ({ ...current, domain: event.target.value }))}
                  aria-invalid={!!errors.domain}
                  placeholder="api.example.com"
                  autoCapitalize="none"
                  autoComplete="off"
                />
                <FieldError>{errors.domain}</FieldError>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="cookie-value">Value</FieldLabel>
              <Input
                id="cookie-value"
                value={draft.value}
                onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                autoComplete="off"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.path}>
                <FieldLabel htmlFor="cookie-path">Path</FieldLabel>
                <Input
                  id="cookie-path"
                  value={draft.path}
                  onChange={(event) => setDraft((current) => ({ ...current, path: event.target.value }))}
                  aria-invalid={!!errors.path}
                />
                <FieldError>{errors.path}</FieldError>
              </Field>
              <Field data-invalid={!!errors.expiresAt}>
                <FieldLabel htmlFor="cookie-expiry">Expires</FieldLabel>
                <Input
                  id="cookie-expiry"
                  type="datetime-local"
                  value={draft.expiresAt}
                  onChange={(event) => setDraft((current) => ({ ...current, expiresAt: event.target.value }))}
                  aria-invalid={!!errors.expiresAt}
                />
                <FieldError>{errors.expiresAt}</FieldError>
              </Field>
            </div>
            <Field data-invalid={!!errors.sameSite}>
              <FieldLabel htmlFor="cookie-same-site">SameSite</FieldLabel>
              <Select
                value={draft.sameSite ?? 'unset'}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    sameSite: value === 'unset' ? null : (value as Exclude<CookieSameSite, null>),
                  }))
                }
              >
                <SelectTrigger id="cookie-same-site" className="w-full" aria-invalid={!!errors.sameSite}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="unset">Unspecified</SelectItem>
                    <SelectItem value="lax">Lax</SelectItem>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError>{errors.sameSite}</FieldError>
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <BooleanField
                id="cookie-secure"
                label="Secure"
                checked={draft.secure}
                onCheckedChange={(checked) => setDraft((current) => ({ ...current, secure: checked }))}
              />
              <BooleanField
                id="cookie-http-only"
                label="HTTP only"
                checked={draft.httpOnly}
                onCheckedChange={(checked) => setDraft((current) => ({ ...current, httpOnly: checked }))}
              />
              <BooleanField
                id="cookie-host-only"
                label="Host only"
                checked={draft.hostOnly}
                onCheckedChange={(checked) => setDraft((current) => ({ ...current, hostOnly: checked }))}
              />
            </div>
            {serverError ? <FieldError>{serverError}</FieldError> : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || Object.keys(errors).length > 0}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? 'Saving…' : 'Save cookie'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BooleanField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange(checked: boolean): void;
}) {
  return (
    <Field orientation="horizontal">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
    </Field>
  );
}

function draftFromCookie(cookie: WorkspaceCookie | null): CookieDraft {
  return {
    name: cookie?.name ?? '',
    value: cookie?.value ?? '',
    domain: cookie?.domain ?? '',
    path: cookie?.path ?? '/',
    expiresAt: cookie?.expiresAt ? toLocalDateTime(cookie.expiresAt) : '',
    secure: cookie?.secure ?? false,
    httpOnly: cookie?.httpOnly ?? false,
    hostOnly: cookie?.hostOnly ?? true,
    sameSite: cookie?.sameSite ?? null,
  };
}

function validateDraft(draft: CookieDraft): Partial<Record<keyof CookieDraft, string>> {
  const errors: Partial<Record<keyof CookieDraft, string>> = {};
  if (!draft.name.trim()) errors.name = 'Name is required.';
  if (!draft.domain.trim()) errors.domain = 'Domain is required.';
  if (!draft.path.startsWith('/')) errors.path = 'Path must start with /.';
  if (draft.expiresAt && !Number.isFinite(new Date(draft.expiresAt).getTime())) errors.expiresAt = 'Invalid expiry.';
  if (draft.sameSite === 'none' && !draft.secure) errors.sameSite = 'SameSite=None requires Secure.';
  return errors;
}

function toLocalDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const local = new Date(timestamp - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
