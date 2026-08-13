import { randomUUID } from 'node:crypto'
import { db } from '../db/db.js'
import { HttpError } from '../http-error.js'
import { buildEntryDataSchema } from '../validation.js'
import type {
  Entry,
  EntryFieldValue,
  EntryInput,
  Schema
} from '@shared/types.js'
import { getSchemaById } from '@server/schemas/schemas.repository.js'

interface EntryRow {
  id: string
  schema_id: string
  data: string
  created_at: string
  updated_at: string
}

function mapEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    schemaId: row.schema_id,
    data: JSON.parse(row.data) as Record<string, EntryFieldValue>,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function getSchemaOrThrow(schemaId: string): Schema {
  const schema = getSchemaById(schemaId)
  if (!schema) throw new HttpError(404, 'Schema not found')
  return schema
}

function assertReferenceEntriesExist(
  schema: Schema,
  data: Record<string, EntryFieldValue>
) {
  for (const field of schema.fields) {
    if (field.type !== 'reference') continue
    const value = data[field.id]
    if (value === null || value === undefined) continue
    if (!field.referenceTargetSchemaId) continue
    if (typeof value !== 'string') continue

    const exists = db
      .prepare('SELECT 1 FROM entries WHERE id = ? AND schema_id = ?')
      .get(value, field.referenceTargetSchemaId)
    if (!exists) {
      throw new HttpError(
        400,
        `Referenced entry "${value}" does not exist in the target schema`
      )
    }
  }
}

export function listEntries(schemaId: string): Entry[] {
  getSchemaOrThrow(schemaId)
  const rows = db
    .prepare(
      'SELECT * FROM entries WHERE schema_id = ? ORDER BY created_at ASC'
    )
    .all(schemaId) as EntryRow[]
  return rows.map(mapEntry)
}

export function getEntryById(schemaId: string, id: string): Entry | undefined {
  const row = db
    .prepare('SELECT * FROM entries WHERE id = ? AND schema_id = ?')
    .get(id, schemaId) as EntryRow | undefined
  if (!row) return undefined
  return mapEntry(row)
}

export function createEntry(schemaId: string, input: EntryInput): Entry {
  const schema = getSchemaOrThrow(schemaId)
  const data = buildEntryDataSchema(schema).parse(input.data) as Record<
    string,
    EntryFieldValue
  >
  assertReferenceEntriesExist(schema, data)

  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    'INSERT INTO entries (id, schema_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, schemaId, JSON.stringify(data), now, now)

  return getEntryById(schemaId, id)!
}

export function updateEntry(
  schemaId: string,
  id: string,
  input: EntryInput
): Entry {
  const schema = getSchemaOrThrow(schemaId)
  const existing = getEntryById(schemaId, id)
  if (!existing) throw new HttpError(404, 'Entry not found')

  const data = buildEntryDataSchema(schema).parse(input.data) as Record<
    string,
    EntryFieldValue
  >
  assertReferenceEntriesExist(schema, data)

  const now = new Date().toISOString()
  db.prepare('UPDATE entries SET data = ?, updated_at = ? WHERE id = ?').run(
    JSON.stringify(data),
    now,
    id
  )

  return getEntryById(schemaId, id)!
}

export function deleteEntry(schemaId: string, id: string): void {
  const existing = getEntryById(schemaId, id)
  if (!existing) throw new HttpError(404, 'Entry not found')
  db.prepare('DELETE FROM entries WHERE id = ?').run(id)
}
