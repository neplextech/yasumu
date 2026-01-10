import { KeyValuePair } from '@/common/types.ts';
import { commonColumns, json } from '../../common/index.ts';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  RestEntityMetadata,
  RestEntityRequestBody,
  YasumuEmbeddedScript,
} from '@yasumu/common';
import { entityGroups } from './entity-group.ts';
import { workspaces } from './workspaces.ts';

export const restEntities = sqliteTable('rest_entity', {
  ...commonColumns<RestEntityMetadata>(),
  name: text('name').notNull(),
  workspaceId: text('workspaceId')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  method: text('method').notNull(),
  url: text('url'),
  requestParameters: json<KeyValuePair[]>('requestParameters').$default(
    () => [],
  ),
  searchParameters: json<KeyValuePair[]>('searchParameters').$default(() => []),
  requestHeaders: json<KeyValuePair[]>('requestHeaders').$default(() => []),
  requestBody: json<RestEntityRequestBody>('requestBody'),
  script: json<YasumuEmbeddedScript>('script'),
  groupId: text('groupId').references(() => entityGroups.id, {
    onDelete: 'cascade',
  }),
});

export const restEntityDependencies = sqliteTable('rest_entity_dependency', {
  ...commonColumns(),
  restEntityId: text('restEntityId')
    .notNull()
    .references(() => restEntities.id, { onDelete: 'cascade' }),
  dependsOnId: text('dependsOnId')
    .notNull()
    .references(() => restEntities.id, { onDelete: 'cascade' }),
});
