import type {
  RestEntityRequestBody,
  SseEntityMetadata,
  SseReconnectOptions,
  YasumuEmbeddedScript,
} from '@yasumu/common';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { KeyValuePair } from '@/common/types.ts';

import { commonColumns, json } from '../../common/index.ts';
import { entityGroups } from './entity-group.ts';
import { workspaces } from './workspaces.ts';

export const sseEntities = sqliteTable('sse_entity', {
  ...commonColumns<SseEntityMetadata>(),
  name: text('name').notNull(),
  workspaceId: text('workspaceId')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  method: text('method').notNull(),
  url: text('url'),
  requestParameters: json<KeyValuePair[]>('requestParameters').$default(() => []),
  searchParameters: json<KeyValuePair[]>('searchParameters').$default(() => []),
  requestHeaders: json<KeyValuePair[]>('requestHeaders').$default(() => []),
  requestBody: json<RestEntityRequestBody>('requestBody'),
  eventTypes: json<string[]>('eventTypes').$default(() => []),
  reconnect: json<SseReconnectOptions>('reconnect').$default(() => ({ enabled: true, retryMs: 3000 })),
  script: json<YasumuEmbeddedScript>('script'),
  testScript: json<YasumuEmbeddedScript>('testScript'),
  groupId: text('groupId').references(() => entityGroups.id, { onDelete: 'cascade' }),
});

export const sseEntityDependencies = sqliteTable('sse_entity_dependency', {
  ...commonColumns(),
  sseEntityId: text('sseEntityId')
    .notNull()
    .references(() => sseEntities.id, { onDelete: 'cascade' }),
  dependsOnId: text('dependsOnId')
    .notNull()
    .references(() => sseEntities.id, { onDelete: 'cascade' }),
});
