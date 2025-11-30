import { relations } from 'drizzle-orm';
import { smtp } from '../tables/smtp.ts';
import { workspaces } from '../tables/workspaces.ts';
import { emails } from '../tables/smtp.ts';

export const smtpRelations = relations(smtp, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [smtp.workspaceId],
    references: [workspaces.id],
  }),
  emails: many(emails),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  smtp: one(smtp, {
    fields: [emails.smtpId],
    references: [smtp.id],
  }),
}));
