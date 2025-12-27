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
  const hash = email
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function EmailContent({ email }: EmailContentProps) {
  if (!email) {
    return (
      <div className="flex items-center justify-center h-full bg-background/30">
        <div className="text-center max-w-md px-6">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-muted-foreground/30"
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
          <p className="text-lg font-semibold mb-2 text-foreground/90">
            Select an email to view
          </p>
          <p className="text-sm text-muted-foreground">
            Choose an email from the list on the left to read its content
          </p>
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
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background/50 backdrop-blur">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0 shadow-md',
                getColorFromEmail(email.from),
              )}
            >
              {getInitials(email.from)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-3 break-words text-foreground">
                {email.subject || (
                  <span className="italic text-muted-foreground font-normal">
                    (No subject)
                  </span>
                )}
              </h1>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground font-medium min-w-[60px]">
                    From:
                  </span>
                  <span className="break-all text-foreground">
                    {email.from}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground font-medium min-w-[60px]">
                    To:
                  </span>
                  <span className="break-all text-foreground">{email.to}</span>
                </div>
                {email.cc && (
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground font-medium min-w-[60px]">
                      CC:
                    </span>
                    <span className="break-all text-foreground">
                      {email.cc}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground font-medium min-w-[60px]">
                    Date:
                  </span>
                  <span className="text-foreground">
                    {formatDate(email.createdAt)}
                  </span>
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
          className="flex-1 w-full border-0 bg-white"
          sandbox="allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
          title="Email content"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-8">
            <div className="max-w-3xl">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-foreground/90 prose-p:leading-relaxed">
                <div className="whitespace-pre-wrap break-words text-base leading-relaxed text-foreground/90">
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
