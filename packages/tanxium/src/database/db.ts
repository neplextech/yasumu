import { DatabaseSync } from 'node:sqlite';
import { ErrorsTable } from './tables/errors.ts';

export class Database {
  public readonly engine: DatabaseSync;

  public errors: ErrorsTable;

  public constructor() {
    this.engine = new DatabaseSync('tanxium.db', {
      open: true,
    });

    this.errors = new ErrorsTable(this);
  }

  public close() {
    this.engine.close();
  }
}
