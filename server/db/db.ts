import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH
  const dataDir = path.join(import.meta.dirname, 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  return path.join(dataDir, 'cms.db')
}

export const db = new Database(resolveDbPath())

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS schemas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fields (
    id TEXT PRIMARY KEY,
    schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
    name TEXT NOT NULL COLLATE NOCASE,
    type TEXT NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'date', 'reference')),
    required INTEGER NOT NULL DEFAULT 0,
    reference_target_schema_id TEXT REFERENCES schemas(id) ON DELETE RESTRICT,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (schema_id, name)
  );

  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)
