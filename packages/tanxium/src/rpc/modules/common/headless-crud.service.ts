import { Injectable } from '@yasumu/den';
import { EntityCrudService } from '@yasumu/headless';

import { db } from '../../../database/index.ts';
import { createDrizzleHeadlessPersistence } from '../../../headless/persistence/index.ts';

/** Shared domain CRUD assembly used by the desktop REST, GraphQL, and SSE adapters. */
@Injectable()
export class HeadlessCrudService {
  public readonly entities: EntityCrudService;

  public constructor() {
    const persistence = createDrizzleHeadlessPersistence(db);
    this.entities = new EntityCrudService(persistence.entities, persistence.workspaces);
  }
}
