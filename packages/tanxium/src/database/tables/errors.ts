import { StatementSync } from 'node:sqlite';
import type { Database } from '../db.ts';

export class ErrorsTable {
  private insertStatement: StatementSync;

  public constructor(private readonly db: Database) {
    this.ensureTable();

    this.insertStatement = this.db.engine.prepare(
      'INSERT INTO errors (message, stack) VALUES (?, ?)',
    );
  }

  public ensureTable() {
    this.db.engine
      .prepare(
        'CREATE TABLE IF NOT EXISTS errors (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, stack TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      )
      .run();
  }

  public insert(error: Error) {
    const message = error.message;
    const stack = error.stack ?? '<no stack trace>';

    this.insertStatement.run({
      message,
      stack,
    });
  }

  public async getLatest(limit: number = 10) {
    const statement = this.db.engine.prepare(
      'SELECT * FROM errors ORDER BY created_at DESC LIMIT ?',
    );

    return statement.all({ limit });
  }
}
