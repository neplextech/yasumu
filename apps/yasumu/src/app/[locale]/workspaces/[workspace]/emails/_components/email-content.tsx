'use client';

import { EmailData } from '@yasumu/core';
import { Badge } from '@yasumu/ui/components/badge';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { cn } from '@yasumu/ui/lib/utils';

interface EmailContentProps {
  email: EmailData | null;
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
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function EmailContent({ email }: EmailContentProps) {
  if (!email) {
    return (
      <div className="bg-background/30 flex h-full items-center justify-center">
        <div className="max-w-md px-6 text-center">
          <div className="mb-6">
            <svg
              className="text-muted-foreground/30 mx-auto h-16 w-16"
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
          <p className="text-foreground/90 mb-2 text-lg font-semibold">Select an email to view</p>
          <p className="text-muted-foreground text-sm">Choose an email from the list on the left to read its content</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-background flex h-full flex-col">
      <div className="bg-background/50 border-b backdrop-blur">
        <div className="space-y-4 p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0 shadow-md',
                getColorFromEmail(email.from),
              )}
            >
              {getInitials(email.from)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-foreground mb-3 text-2xl font-bold break-words">
                {email.subject || <span className="text-muted-foreground font-normal italic">(No subject)</span>}
              </h1>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px] font-medium">From:</span>
                  <span className="text-foreground break-all">{email.from}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px] font-medium">To:</span>
                  <span className="text-foreground break-all">{email.to}</span>
                </div>
                {email.cc && (
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground min-w-[60px] font-medium">CC:</span>
                    <span className="text-foreground break-all">{email.cc}</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px] font-medium">Date:</span>
                  <span className="text-foreground">{formatDate(email.createdAt)}</span>
                </div>
              </div>
            </div>
            {email.unread && (
              <Badge variant="default" className="shrink-0">
                Unread
              </Badge>
            )}
          </div>
        </div>
      </div>
      {email.html ? (
        <iframe
          srcDoc={`${email.html}`}
          className="w-full flex-1 border-0 bg-white"
          sandbox="allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
          title="Email content"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-8">
            <div className="max-w-3xl">
              <div className="prose prose-sm dark:prose-invert prose-headings:font-semibold prose-p:text-foreground/90 prose-p:leading-relaxed max-w-none">
                <div className="text-foreground/90 text-base leading-relaxed break-words whitespace-pre-wrap">
                  {email.text}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
