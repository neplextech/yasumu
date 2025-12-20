import type { SMTPServerDataStream } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { db } from '../database/index.ts';
import { workspaces } from '../database/schema.ts';
import { eq } from 'drizzle-orm';
import { emails, smtp } from '../database/schema/tables/smtp.ts';

export async function createEmail(
  stream: SMTPServerDataStream,
  workspaceId: string,
) {
  const email = await simpleParser(stream);

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) return;

  const smtpConfig = await db.query.smtp.findFirst({
    where: eq(smtp.workspaceId, workspaceId),
  });

  if (!smtpConfig) return;

  const mailFrom = email.from?.text;
  const mailTo = Array.isArray(email.to)
    ? email.to.map((t) => t.text).join(',')
    : email.to?.text;
  const mailCc =
    (Array.isArray(email.cc)
      ? email.cc.map((c) => c.text).join(',')
      : email.cc?.text) || null;
  const mailSubject = email.subject;
  const mailHtml = email.html || '';
  const mailText = email.text || '';

  // missing required fields
  if (!mailFrom || !mailTo || !mailSubject) {
    return;
  }

  const [newEmail] = await db
    .insert(emails)
    .values({
      from: mailFrom,
      to: mailTo,
      subject: mailSubject,
      html: mailHtml,
      text: mailText,
      cc: mailCc,
      smtpId: smtpConfig.id,
    })
    .returning();

  await Yasumu.postMessage({
    event: 'new-email',
    data: { workspaceId, newEmail },
  });
}
