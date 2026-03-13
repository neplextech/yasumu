import { KeyValuePair } from '@/common/types.ts';
import { commonColumns, json } from '../../common/index.ts';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  GraphqlEntityMetadata,
  GraphqlEntityRequestBody,
  YasumuEmbeddedScript,
} from '@yasumu/common';
import { entityGroups } from './entity-group.ts';
import { workspaces } from './workspaces.ts';

export const graphqlEntities = sqliteTable('graphql_entity', {
  ...commonColumns<GraphqlEntityMetadata>(),
  name: text('name').notNull(),
  workspaceId: text('workspaceId')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  url: text('url'),
  requestParameters: json<KeyValuePair[]>('requestParameters').$default(
    () => [],
  ),
  searchParameters: json<KeyValuePair[]>('searchParameters').$default(() => []),
  requestHeaders: json<KeyValuePair[]>('requestHeaders').$default(() => []),
  requestBody: json<GraphqlEntityRequestBody>('requestBody'),
  script: json<YasumuEmbeddedScript>('script'),
  groupId: text('groupId').references(() => entityGroups.id, {
    onDelete: 'cascade',
  }),
});

export const graphqlEntityDependencies = sqliteTable(
  'graphql_entity_dependency',
  {
    ...commonColumns(),
    graphqlEntityId: text('graphqlEntityId')
      .notNull()
      .references(() => graphqlEntities.id, { onDelete: 'cascade' }),
    dependsOnId: text('dependsOnId')
      .notNull()
      .references(() => graphqlEntities.id, { onDelete: 'cascade' }),
  },
);
