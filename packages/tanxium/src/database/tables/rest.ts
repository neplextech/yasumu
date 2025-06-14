import { StatementSync } from 'node:sqlite';
import type { Database } from '../db.ts';
import { DatabaseTable } from './common.ts';

export class RestTable implements DatabaseTable {
  private insertStatement: StatementSync;

  public constructor(private readonly db: Database) {
    this.ensureTable();
    this.insertStatement = this.db.engine.prepare(
      'INSERT INTO rests (workspace_id) VALUES (?)',
    );
  }

  public ensureTable() {
    this.db.engine
      .prepare(
        'CREATE TABLE IF NOT EXISTS rests (id INTEGER PRIMARY KEY AUTOINCREMENT, workspace_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE)',
      )
      .run();
  }

  public insert(workspaceId: number) {
    return this.insertStatement.run(workspaceId);
  }

  public getByWorkspaceId(workspaceId: number) {
    return this.db.engine
      .prepare('SELECT * FROM rests WHERE workspace_id = ?')
      .get(workspaceId);
  }
}
