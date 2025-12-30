import type { restEntities } from '@/database/schema.ts';
import type { EntityType } from '@yasumu/common';

export type {
  EntityType,
  EntityGroupCreateOptions,
  EntityGroupUpdateOptions,
} from '@yasumu/common';

export interface TreeViewOptions {
  workspaceId: string;
  entityType: EntityType;
}

export type EntityTable = typeof restEntities;
