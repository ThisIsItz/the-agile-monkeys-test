import { db } from './db.js'

export function getMetadata(key: string): string | undefined {
  const row = db
    .prepare('SELECT value FROM app_metadata WHERE key = ?')
    .get(key) as { value: string } | undefined

  return row?.value
}

export function setMetadata(key: string, value: string): void {
  db.prepare(
    `
    INSERT INTO app_metadata (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `
  ).run(key, value)
}
