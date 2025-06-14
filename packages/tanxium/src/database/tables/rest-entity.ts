import { StatementSync } from 'node:sqlite';
import type { Database } from '../db.ts';
import type { DatabaseTable, Body, HttpMethod, KeyValue } from './common.ts';

export class RestEntityTable implements DatabaseTable {
  private insertStatement: StatementSync;
  private insertMetadataStatement: StatementSync;

  public constructor(private readonly db: Database) {
    this.ensureTable();
    this.insertStatement = this.db.engine.prepare(
      'INSERT INTO rest_entities (rest_id, name, parent_id) VALUES (?, ?, ?)',
    );
    this.insertMetadataStatement = this.db.engine.prepare(
      'INSERT INTO rest_entity_metadata (entity_id, url, method, headers, body, body_type) VALUES (?, ?, ?, ?, ?, ?)',
    );
  }

  public ensureTable() {
    this.db.engine
      .prepare(
        'CREATE TABLE IF NOT EXISTS rest_entities (id INTEGER PRIMARY KEY AUTOINCREMENT, rest_id INTEGER NOT NULL, name TEXT NOT NULL, parent_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (rest_id) REFERENCES rests(id) ON DELETE CASCADE, FOREIGN KEY (parent_id) REFERENCES rest_entities(id) ON DELETE CASCADE)',
      )
      .run();

    this.db.engine
      .prepare(
        'CREATE TABLE IF NOT EXISTS rest_entity_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_id INTEGER NOT NULL, url TEXT NOT NULL, method TEXT NOT NULL, headers TEXT NOT NULL, body TEXT, body_type TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (entity_id) REFERENCES rest_entities(id) ON DELETE CASCADE)',
      )
      .run();
  }

  public insert(restId: number, name: string, parentId?: number) {
    return this.insertStatement.run(restId, name, parentId ?? null);
  }

  public insertMetadata(
    entityId: number,
    url: string,
    method: HttpMethod,
    headers: KeyValue[],
    body?: Body,
  ) {
    return this.insertMetadataStatement.run(
      entityId,
      url,
      method,
      JSON.stringify(headers),
      body ? JSON.stringify(body) : null,
      body?.type ?? null,
    );
  }

  public getByRestId(restId: number) {
    return this.db.engine
      .prepare('SELECT * FROM rest_entities WHERE rest_id = ?')
      .all(restId);
  }

  public getMetadata(entityId: number) {
    return this.db.engine
      .prepare('SELECT * FROM rest_entity_metadata WHERE entity_id = ?')
      .get(entityId);
  }
}
