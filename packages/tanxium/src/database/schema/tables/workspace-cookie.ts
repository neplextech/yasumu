import type { CookieSameSite } from '@yasumu/headless';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { commonColumns } from '../../common/index.ts';
import { workspaces } from './workspaces.ts';

export const workspaceCookies = sqliteTable(
  'workspace_cookie',
  {
    ...commonColumns(),
    workspaceId: text('workspaceId')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    value: text('value').notNull(),
    domain: text('domain').notNull(),
    path: text('path').notNull().default('/'),
    expiresAt: integer('expiresAt'),
    secure: integer('secure', { mode: 'boolean' }).notNull().default(false),
    httpOnly: integer('httpOnly', { mode: 'boolean' }).notNull().default(false),
    sameSite: text('sameSite').$type<CookieSameSite>(),
    hostOnly: integer('hostOnly', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [
    uniqueIndex('workspace_cookie_identity_unique').on(table.workspaceId, table.name, table.domain, table.path),
    index('workspace_cookie_workspace_idx').on(table.workspaceId),
    index('workspace_cookie_expiry_idx').on(table.workspaceId, table.expiresAt),
  ],
);
