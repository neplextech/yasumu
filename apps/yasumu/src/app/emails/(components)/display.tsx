'use client';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useCurrentMail } from '@/stores/MailStore';

export function MailDisplay() {
  const mail = useCurrentMail();
  if (!mail)
    return (
      <div className="grid place-items-center text-center h-full">
        <h1>Select an email to preview</h1>
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2"></div>
      <Separator />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm">
            <div className="grid gap-1">
              <div className="line-clamp-1 text-base font-medium">
                {mail.subject}
              </div>
              <div className="line-clamp-1 text-sm">
                <span className="font-medium">ID:</span> {mail.id}
              </div>
              <div className="line-clamp-1 text-sm">
                <span className="font-medium">From:</span> {mail.from}
              </div>
              <div className="line-clamp-1 text-sm">
                <span className="font-medium">To:</span> {mail.to}
              </div>
            </div>
          </div>
          {mail.date && (
            <div className="ml-auto text-xs text-muted-foreground">
              {format(new Date(mail.date), 'PPpp')}
            </div>
          )}
        </div>
        <Separator />
        <div className="flex-1 whitespace-pre-wrap p-4 text-base">
          {mail.body}
        </div>
        <Separator className="mt-auto" />
      </div>
    </div>
  );
}
