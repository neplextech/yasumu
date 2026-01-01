import type { SMTPServerDataStream } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { db } from '../database/index.ts';
import { emails } from '../database/schema/tables/smtp.ts';

export async function createEmail(
  stream: SMTPServerDataStream,
  workspaceId: string,
  smtpId: string,
) {
  const email = await simpleParser(stream);

  const mailFrom = email.from?.text;
  const mailTo = Array.isArray(email.to)
    ? email.to.map((t) => t.text).join(',')
    : email.to?.text;
  const mailCc =
    (Array.isArray(email.cc)
      ? email.cc.map((c) => c.text).join(',')
      : email.cc?.text) || null;
  const mailSubject = email.subject || '(No subject)';
  const mailHtml = email.html || '(No Body)';
  const mailText = email.text || '(No Body)';

  // missing required fields
  if (!mailFrom || !mailTo) return;

  const [newEmail] = await db
    .insert(emails)
    .values({
      from: mailFrom,
      to: mailTo,
      subject: mailSubject,
      html: mailHtml,
      text: mailText,
      cc: mailCc,
      smtpId,
    })
    .returning();

  await Yasumu.postMessage({
    event: 'new-email',
    data: { workspaceId, newEmail },
  });

  await Yasumu.ui.showNotification({
    title: 'You have received a new email',
    message: 'Check your email inbox to view the new email',
    variant: 'success',
  });
}
