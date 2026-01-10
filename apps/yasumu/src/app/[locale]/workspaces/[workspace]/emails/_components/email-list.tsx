'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Badge } from '@yasumu/ui/components/badge';
import { Tabs, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { cn } from '@yasumu/ui/lib/utils';
import { EmailData } from '@yasumu/core';

interface EmailListProps {
  emails: EmailData[];
  selectedEmailId?: string;
  onSelectEmail: (emailId: string) => void;
  filter: 'all' | 'unread';
  onFilterChange: (filter: 'all' | 'unread') => void;
}

const getInitials = (from: string) => {
  const parts = from.split('@')[0].split(/[.\-_]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return from[0].toUpperCase();
};

const getColorFromEmail = (email: string) => {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-red-500',
  ];
  const hash = email
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function EmailList({
  emails,
  selectedEmailId,
  onSelectEmail,
  filter,
  onFilterChange,
}: EmailListProps) {
  const filteredEmails =
    filter === 'unread' ? emails.filter((email) => email.unread) : emails;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col h-full border-r bg-background/50">
        <div className="p-4 border-b bg-background">
          <Tabs
            value={filter}
            onValueChange={(v) => onFilterChange(v as 'all' | 'unread')}
          >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="all" className="flex-1">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Unread{' '}
                {emails.filter((e) => e.unread).length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {emails.filter((e) => e.unread).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div>
          {filteredEmails.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">
                {filter === 'unread' ? 'No unread emails' : 'No emails'}
              </p>
              <p className="text-xs mt-1">
                {filter === 'unread'
                  ? 'All caught up!'
                  : 'Your mailbox is empty'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => onSelectEmail(email.id)}
                  className={cn(
                    'w-full text-left p-4 hover:bg-muted/30 transition-all duration-150 border-l-2 border-transparent relative group',
                    selectedEmailId === email.id &&
                      'bg-muted/50 border-l-primary shadow-sm',
                    email.unread &&
                      selectedEmailId !== email.id &&
                      'bg-accent/20',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 shadow-sm',
                        getColorFromEmail(email.from),
                      )}
                    >
                      {getInitials(email.from)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm break-words',
                              email.unread ? 'font-semibold' : 'font-medium',
                              selectedEmailId === email.id
                                ? 'text-foreground'
                                : 'text-foreground/90',
                            )}
                          >
                            {email.from}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {email.unread && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(email.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p
                        className={cn(
                          'text-sm break-words',
                          email.unread
                            ? 'font-semibold text-foreground'
                            : 'font-normal text-foreground/80',
                        )}
                      >
                        {email.subject || (
                          <span className="italic text-muted-foreground">
                            (No subject)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed break-words">
                        {email.text.slice(0, 150)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
