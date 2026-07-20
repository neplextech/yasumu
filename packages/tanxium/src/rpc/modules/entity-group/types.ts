import type { EntityType } from '@yasumu/common';

import type { restEntities, graphqlEntities, sseEntities } from '@/database/schema.ts';

export type { EntityType, EntityGroupCreateOptions, EntityGroupUpdateOptions } from '@yasumu/common';

export interface TreeViewOptions {
  workspaceId: string;
  entityType: EntityType;
}

export type EntityTable = typeof restEntities | typeof graphqlEntities | typeof sseEntities;
