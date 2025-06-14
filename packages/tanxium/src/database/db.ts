import { DatabaseSync } from 'node:sqlite';
import { ErrorsTable } from './tables/errors.ts';
import { WorkspaceTable } from './tables/workspace.ts';
import { RestTable } from './tables/rest.ts';
import { RestEntityTable } from './tables/rest-entity.ts';

export class Database {
  public readonly engine: DatabaseSync;

  public errors: ErrorsTable;
  public workspaces: WorkspaceTable;
  public rest: RestTable;
  public restEntity: RestEntityTable;

  public constructor() {
    this.engine = new DatabaseSync('tanxium.db', {
      open: true,
    });

    this.errors = new ErrorsTable(this);
    this.workspaces = new WorkspaceTable(this);
    this.rest = new RestTable(this);
    this.restEntity = new RestEntityTable(this);
  }

  public close() {
    this.engine.close();
  }
}
