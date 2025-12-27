'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import EmailList from './email-list';
import EmailContent from './email-content';
import LoadingScreen from '@/components/visuals/loading-screen';

export default function MailboxTab() {
  const [selectedEmailId, setSelectedEmailId] = useQueryState(
    'email',
    parseAsString,
  );
  const [filter, setFilter] = useQueryState<'all' | 'unread'>(
    'filter',
    parseAsStringEnum(['all', 'unread'] as const).withDefault('all'),
  );
  const [searchQuery] = useQueryState('search', parseAsString);
  const workspace = useActiveWorkspace();

  const {
    data: emails,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['emails', filter, searchQuery],
    queryFn: ({ pageParam = 0 }) =>
      workspace.emails.listEmails({
        unread: filter === 'unread' || undefined,
        skip: pageParam,
        take: 10,
        search: searchQuery || undefined,
        sort: 'desc',
      }),
    getNextPageParam: (lastPage) =>
      lastPage.totalItems > lastPage.items.length
        ? lastPage.items.length
        : undefined,
    initialPageParam: 0,
    select: (data) => data.pages.flatMap((page) => page.items),
  });

  useEffect(() => {
    const controller = new AbortController();
    yasumu.events.on(
      'onNewEmail',
      () => {
        return refetch();
      },
      {
        signal: controller.signal,
      },
    );

    return () => {
      controller.abort();
    };
  }, []);

  const selectedEmail = emails?.find((e) => e.id === selectedEmailId);

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
  };

  return (
    <div className="flex h-full">
      <div className="w-[420px] shrink-0 border-r">
        {isLoading ? (
          <LoadingScreen fullScreen />
        ) : (
          <EmailList
            emails={emails || []}
            selectedEmailId={selectedEmailId ?? undefined}
            onSelectEmail={handleSelectEmail}
            filter={filter}
            onFilterChange={setFilter}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <LoadingScreen fullScreen />
        ) : (
          <EmailContent email={selectedEmail || null} />
        )}
      </div>
    </div>
  );
}
