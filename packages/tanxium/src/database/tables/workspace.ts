import { StatementSync } from 'node:sqlite';
import type { Database } from '../db.ts';
import { DatabaseTable } from './common.ts';

export class WorkspaceTable implements DatabaseTable {
  private insertStatement: StatementSync;

  public constructor(private readonly db: Database) {
    this.ensureTable();
    this.insertStatement = this.db.engine.prepare(
      'INSERT INTO workspaces (name) VALUES (?)',
    );
  }

  public ensureTable() {
    this.db.engine
      .prepare(
        'CREATE TABLE IF NOT EXISTS workspaces (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      )
      .run();
  }

  public insert(name: string) {
    return this.insertStatement.run(name);
  }

  public getById(id: number) {
    return this.db.engine
      .prepare('SELECT * FROM workspaces WHERE id = ?')
      .get(id);
  }
}
