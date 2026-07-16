import { EntityCrudService } from "@yasumu/headless";
import { Injectable } from "@yasumu/den";

import { db } from "../../../database/index.ts";
import { createDrizzleHeadlessPersistence } from "../../../headless/persistence/index.ts";

/** Shared domain CRUD assembly used by the desktop REST and GraphQL adapters. */
@Injectable()
export class HeadlessCrudService {
  public readonly entities: EntityCrudService;

  public constructor() {
    const persistence = createDrizzleHeadlessPersistence(db);
    this.entities = new EntityCrudService(
      persistence.entities,
      persistence.workspaces,
    );
  }
}
