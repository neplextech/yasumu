import { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { db } from '../../../database/index.ts';
import { entityGroups } from '../../../database/schema.ts';
import type { rest, restEntities } from '../../../database/schema.ts';

type MapEntityTable<T extends keyof typeof db.query> =
  T extends `${infer K}Entities` ? T : T extends `${infer K}Entity` ? T : never;

export interface EntityGroupCreateOptions {
  name: string;
  parentId: string | null;
  entityType: EntityType;
}

export interface EntityGroupUpdateOptions {
  name?: string;
  parentId?: string | null;
}

export interface TreeViewOptions {
  workspaceId: string;
  entityField: SQLiteColumn;
  owner: EntityOwner;
  tableName: MapEntityTable<keyof typeof db.query>;
  groupId?: string | null;
  entityType: EntityType;
}

export type EntityType = (typeof entityGroups.$inferInsert)['entityType'];

export type EntityTable = typeof restEntities;
export type EntityOwner = typeof rest.$inferSelect;
