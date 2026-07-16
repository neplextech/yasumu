'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@yasumu/ui/components/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@yasumu/ui/components/resizable';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect } from 'react';

import { useActiveWorkspace, useYasumuRuntime } from '@/components/providers/workspace-provider';
import ErrorScreen from '@/components/visuals/error-screen';
import LoadingScreen from '@/components/visuals/loading-screen';

import EmailContent from './email-content';
import EmailList from './email-list';

export default function MailboxTab() {
  const [selectedEmailId, setSelectedEmailId] = useQueryState('email', parseAsString);
  const [filter, setFilter] = useQueryState<'all' | 'unread'>(
    'filter',
    parseAsStringEnum(['all', 'unread'] as const).withDefault('all'),
  );
  const [searchQuery] = useQueryState('search', parseAsString);
  const workspace = useActiveWorkspace();
  const { yasumu } = useYasumuRuntime();

  const {
    data: emails,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['emails', workspace.id, filter, searchQuery],
    queryFn: ({ pageParam = 0 }) =>
      workspace.emails.listEmails({
        unread: filter === 'unread' || undefined,
        skip: pageParam,
        take: 10,
        search: searchQuery || undefined,
        sort: 'desc',
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.items.length === 0) return undefined;

      const loadedCount = allPages.reduce((count, page) => count + page.items.length, 0);
      return loadedCount < lastPage.totalItems ? loadedCount : undefined;
    },
    initialPageParam: 0,
    select: (data) => data.pages.flatMap((page) => page.items),
  });

  useEffect(() => {
    return yasumu.events.on('onNewEmail', (workspaceId) => {
      if (workspaceId === workspace.id) {
        return refetch();
      }
    });
  }, [refetch, workspace.id, yasumu]);

  const selectedEmail = emails?.find((e) => e.id === selectedEmailId);

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
  };

  if (error && !emails) {
    return (
      <ErrorScreen
        className="h-full w-full"
        title="Could not load the mailbox"
        message={error instanceof Error ? error.message : 'An unexpected error occurred while loading emails.'}
        action={
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
        {isLoading ? (
          <LoadingScreen className="h-full w-full" message="Loading mailbox..." />
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1">
              <EmailList
                emails={emails || []}
                selectedEmailId={selectedEmailId ?? undefined}
                onSelectEmail={handleSelectEmail}
                filter={filter}
                onFilterChange={setFilter}
              />
            </div>
            {hasNextPage ? (
              <div className="border-t p-2" aria-live="polite">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  disabled={isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                >
                  {isFetchingNextPage ? 'Loading more emails...' : 'Load more emails'}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize mailbox list" />
      <ResizablePanel defaultSize={70} minSize={50}>
        {isLoading ? (
          <LoadingScreen className="h-full w-full" message="Loading email content..." />
        ) : (
          <EmailContent email={selectedEmail || null} />
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
