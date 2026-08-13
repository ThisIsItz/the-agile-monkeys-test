import { randomUUID } from 'node:crypto'

import type {
  FieldInput,
  Field,
  FieldType,
  SchemaInput,
  Schema
} from '@shared/types.js'
import { db } from '@server/db/db.js'
import { HttpError } from '@server/http-error.js'

interface SchemaRow {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface FieldRow {
  id: string
  schema_id: string
  name: string
  type: FieldType
  required: number
  reference_target_schema_id: string | null
  position: number
  created_at: string
  updated_at: string
}

function isSqliteConstraintError(
  err: unknown,
  kind: 'UNIQUE' | 'FOREIGNKEY'
): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err)) return false
  const code = (err as { code: unknown }).code
  if (typeof code !== 'string' || !code.startsWith('SQLITE_CONSTRAINT'))
    return false

  if (kind === 'UNIQUE') return code === 'SQLITE_CONSTRAINT_UNIQUE'

  // SQLite enforces FKs via internal triggers, so the code is sometimes
  // SQLITE_CONSTRAINT_TRIGGER rather than SQLITE_CONSTRAINT_FOREIGNKEY.
  const message = (err as { message?: unknown }).message
  return (
    code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ||
    (code === 'SQLITE_CONSTRAINT_TRIGGER' &&
      typeof message === 'string' &&
      message.includes('FOREIGN KEY'))
  )
}

function mapField(row: FieldRow): Field {
  return {
    id: row.id,
    schemaId: row.schema_id,
    name: row.name,
    type: row.type,
    required: Boolean(row.required),
    referenceTargetSchemaId: row.reference_target_schema_id,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapSchema(row: SchemaRow, fieldRows: FieldRow[]): Schema {
  return {
    id: row.id,
    name: row.name,
    fields: fieldRows.map(mapField),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function getFieldRows(schemaId: string): FieldRow[] {
  return db
    .prepare('SELECT * FROM fields WHERE schema_id = ? ORDER BY position ASC')
    .all(schemaId) as FieldRow[]
}

export function listSchemas(): Schema[] {
  const rows = db
    .prepare('SELECT * FROM schemas ORDER BY created_at ASC')
    .all() as SchemaRow[]
  return rows.map((row) => mapSchema(row, getFieldRows(row.id)))
}

export function getSchemaById(id: string): Schema | undefined {
  const row = db.prepare('SELECT * FROM schemas WHERE id = ?').get(id) as
    | SchemaRow
    | undefined
  if (!row) return undefined
  return mapSchema(row, getFieldRows(id))
}

export function getSchemaByName(name: string): Schema | undefined {
  const row = db.prepare('SELECT * FROM schemas WHERE name = ?').get(name) as
    | SchemaRow
    | undefined
  if (!row) return undefined
  return mapSchema(row, getFieldRows(row.id))
}

function assertReferenceTargetExists(field: FieldInput) {
  if (field.type !== 'reference') return
  if (!field.referenceTargetSchemaId) {
    throw new HttpError(400, 'Reference field requires a target schema')
  }
  const target = getSchemaById(field.referenceTargetSchemaId)
  if (!target) {
    throw new HttpError(
      400,
      `Referenced schema "${field.referenceTargetSchemaId}" does not exist`
    )
  }
}

function insertField(
  schemaId: string,
  field: FieldInput,
  position: number,
  now: string
) {
  assertReferenceTargetExists(field)
  try {
    db.prepare(
      `INSERT INTO fields (id, schema_id, name, type, required, reference_target_schema_id, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      schemaId,
      field.name,
      field.type,
      field.required ? 1 : 0,
      field.type === 'reference' ? field.referenceTargetSchemaId : null,
      position,
      now,
      now
    )
  } catch (err) {
    if (isSqliteConstraintError(err, 'UNIQUE')) {
      throw new HttpError(
        409,
        `Field name "${field.name}" is duplicated in this schema`
      )
    }
    throw err
  }
}

function updateField(
  fieldId: string,
  field: FieldInput,
  position: number,
  now: string
) {
  assertReferenceTargetExists(field)
  try {
    db.prepare(
      `UPDATE fields
       SET name = ?, type = ?, required = ?, reference_target_schema_id = ?, position = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      field.name,
      field.type,
      field.required ? 1 : 0,
      field.type === 'reference' ? field.referenceTargetSchemaId : null,
      position,
      now,
      fieldId
    )
  } catch (err) {
    if (isSqliteConstraintError(err, 'UNIQUE')) {
      throw new HttpError(
        409,
        `Field name "${field.name}" is duplicated in this schema`
      )
    }
    throw err
  }
}

export function createSchema(input: SchemaInput): Schema {
  const id = randomUUID()
  const now = new Date().toISOString()

  const run = db.transaction(() => {
    try {
      db.prepare(
        'INSERT INTO schemas (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)'
      ).run(id, input.name, now, now)
    } catch (err) {
      if (isSqliteConstraintError(err, 'UNIQUE')) {
        throw new HttpError(
          409,
          `A schema named "${input.name}" already exists`
        )
      }
      throw err
    }

    input.fields.forEach((field, index) => insertField(id, field, index, now))
  })

  run()
  return getSchemaById(id)!
}

export function updateSchema(id: string, input: SchemaInput): Schema {
  const existing = getSchemaById(id)
  if (!existing) throw new HttpError(404, 'Schema not found')

  const now = new Date().toISOString()
  const existingFieldIds = new Set(existing.fields.map((f) => f.id))
  const incomingFieldIds = new Set(
    input.fields.filter((f) => f.id).map((f) => f.id!)
  )

  const run = db.transaction(() => {
    try {
      db.prepare(
        'UPDATE schemas SET name = ?, updated_at = ? WHERE id = ?'
      ).run(input.name, now, id)
    } catch (err) {
      if (isSqliteConstraintError(err, 'UNIQUE')) {
        throw new HttpError(
          409,
          `A schema named "${input.name}" already exists`
        )
      }
      throw err
    }

    for (const fieldId of existingFieldIds) {
      if (!incomingFieldIds.has(fieldId)) {
        db.prepare('DELETE FROM fields WHERE id = ?').run(fieldId)
      }
    }

    input.fields.forEach((field, index) => {
      if (field.id && existingFieldIds.has(field.id)) {
        updateField(field.id, field, index, now)
      } else {
        insertField(id, field, index, now)
      }
    })
  })

  run()
  return getSchemaById(id)!
}

export function deleteSchema(id: string): void {
  const existing = getSchemaById(id)
  if (!existing) throw new HttpError(404, 'Schema not found')

  try {
    db.prepare('DELETE FROM schemas WHERE id = ?').run(id)
  } catch (err) {
    if (isSqliteConstraintError(err, 'FOREIGNKEY')) {
      throw new HttpError(
        409,
        "Cannot delete a schema that is referenced by another schema's field"
      )
    }
    throw err
  }
}
