'use client';

import type { WorkspaceCookie } from '@yasumu/core';
import { Alert, AlertDescription, AlertTitle } from '@yasumu/ui/components/alert';
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
import { Badge } from '@yasumu/ui/components/badge';
import { Button, buttonVariants } from '@yasumu/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@yasumu/ui/components/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@yasumu/ui/components/input-group';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@yasumu/ui/components/sheet';
import { SidebarMenuButton, SidebarMenuItem } from '@yasumu/ui/components/sidebar';
import { Skeleton } from '@yasumu/ui/components/skeleton';
import { toast } from '@yasumu/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { AlertCircle, Cookie, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';

import { CookieEditorDialog } from './cookie-editor-dialog';
import { useWorkspaceCookies } from './use-workspace-cookies';

export function CookieJarSheet() {
  const workspace = useActiveWorkspace();
  const [open, setOpen] = useState(false);

  return (
    <SidebarMenuItem>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <SidebarMenuButton tooltip={{ children: 'Cookie Jar', hidden: false }} className="px-2.5 md:px-2">
            <Cookie />
            <span>Cookie Jar</span>
          </SidebarMenuButton>
        </SheetTrigger>
        <SheetContent className="w-[min(94vw,60rem)] gap-0 sm:max-w-none">
          <SheetHeader className="border-b">
            <SheetTitle>Workspace cookie jar</SheetTitle>
            <SheetDescription>
              Cookies are shared by requests in this workspace and stored only in Yasumu&apos;s local database.
            </SheetDescription>
          </SheetHeader>
          {open ? <CookieJarContent key={workspace.id} /> : null}
        </SheetContent>
      </Sheet>
    </SidebarMenuItem>
  );
}

function CookieJarContent() {
  const { data = [], isLoading, error, upsert, remove, clear } = useWorkspaceCookies();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<WorkspaceCookie | 'new' | null>(null);
  const [deleting, setDeleting] = useState<WorkspaceCookie | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      normalizedSearch
        ? data.filter((cookie) =>
            [cookie.name, cookie.domain, cookie.path].some((value) => value.toLowerCase().includes(normalizedSearch)),
          )
        : data,
    [data, normalizedSearch],
  );

  const deleteCookie = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(`Deleted ${deleting.name}`);
      setDeleting(null);
    } catch (mutationError) {
      toast.error('Failed to delete cookie', { description: errorMessage(mutationError) });
    }
  };

  const clearJar = async () => {
    try {
      await clear.mutateAsync();
      toast.success('Workspace cookie jar cleared');
      setConfirmClear(false);
    } catch (mutationError) {
      toast.error('Failed to clear cookie jar', { description: errorMessage(mutationError) });
    }
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <InputGroup className="min-w-48 flex-1 sm:max-w-md">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, domain, or path"
              aria-label="Search workspace cookies"
            />
          </InputGroup>
          <Badge variant="secondary">{data.length} stored</Badge>
          <Button type="button" className="ml-auto" onClick={() => setEditing('new')}>
            <Plus data-icon="inline-start" /> Add cookie
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive" className="m-4">
            <AlertCircle />
            <AlertTitle>Could not load the cookie jar</AlertTitle>
            <AlertDescription>{errorMessage(error)}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <CookieTableSkeleton />
        ) : filtered.length ? (
          <ScrollArea className="min-h-0 flex-1">
            <Table>
              <TableHeader className="bg-background sticky top-0">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cookie) => (
                  <TableRow key={cookie.id}>
                    <TableCell className="max-w-48">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-medium" title={cookie.name}>
                          {cookie.name}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">••••••••</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-56 truncate font-mono text-xs" title={cookie.domain}>
                      {cookie.domain}
                    </TableCell>
                    <TableCell className="max-w-40 truncate font-mono text-xs" title={cookie.path}>
                      {cookie.path}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatExpiry(cookie.expiresAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cookie.secure ? <Badge variant="outline">Secure</Badge> : null}
                        {cookie.httpOnly ? <Badge variant="outline">HTTP only</Badge> : null}
                        {cookie.hostOnly ? <Badge variant="outline">Host only</Badge> : null}
                        {cookie.sameSite ? <Badge variant="secondary">{cookie.sameSite}</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${cookie.name}`}
                          onClick={() => setEditing(cookie)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${cookie.name}`}
                          onClick={() => setDeleting(cookie)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <Empty className="m-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">{normalizedSearch ? <Search /> : <Cookie />}</EmptyMedia>
              <EmptyTitle>{normalizedSearch ? 'No matching cookies' : 'The jar is empty'}</EmptyTitle>
              <EmptyDescription>
                {normalizedSearch
                  ? 'Try a different name, domain, or path.'
                  : 'Response cookies will appear automatically, or you can add one manually.'}
              </EmptyDescription>
            </EmptyHeader>
            {!normalizedSearch ? (
              <EmptyContent>
                <Button type="button" variant="outline" onClick={() => setEditing('new')}>
                  <Plus data-icon="inline-start" /> Add your first cookie
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        )}
      </div>

      <SheetFooter className="flex-row flex-wrap items-center border-t">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <ShieldCheck /> Local to this workspace; never written to YSL.
        </div>
        <Button
          type="button"
          variant="outline"
          className="ml-auto"
          disabled={!data.length || clear.isPending}
          onClick={() => setConfirmClear(true)}
        >
          <Trash2 data-icon="inline-start" /> Clear jar
        </Button>
      </SheetFooter>

      {editing ? (
        <CookieEditorDialog
          key={editing === 'new' ? 'new' : editing.id}
          cookie={editing === 'new' ? null : editing}
          pending={upsert.isPending}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            await upsert.mutateAsync(input);
            toast.success(editing === 'new' ? 'Cookie added' : 'Cookie updated');
          }}
        />
      ) : null}

      <AlertDialog open={!!deleting} onOpenChange={(nextOpen) => !nextOpen && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Requests in this workspace will stop sending this cookie. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => void deleteCookie()}
              disabled={remove.isPending}
            >
              Delete cookie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear this workspace&apos;s cookie jar?</AlertDialogTitle>
            <AlertDialogDescription>
              All {data.length} stored cookies will be removed. Requests may lose authenticated sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clear.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => void clearJar()}
              disabled={clear.isPending}
            >
              Clear jar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CookieTableSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4" aria-label="Loading workspace cookies">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function formatExpiry(expiresAt: number | null): string {
  return expiresAt === null ? 'Session' : new Date(expiresAt).toLocaleString();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown cookie jar error';
}
