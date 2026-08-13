import { Router } from 'express'
import { getSchemaByName } from './schemas.repository.js'
import { getEntryById, listEntries } from './entries.repository.js'
import { HttpError } from './http-error.js'
import type { Entry, EntryFieldValue, Schema } from '@shared/types.js'

export const contentRouter = Router()

function toContentEntry(schema: Schema, entry: Entry) {
  const data: Record<string, EntryFieldValue> = {}
  for (const field of schema.fields) {
    data[field.name] = entry.data[field.id] ?? null
  }

  return {
    id: entry.id,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    data
  }
}

contentRouter.get('/:schemaName', (req, res) => {
  const schema = getSchemaByName(req.params.schemaName)
  if (!schema) throw new HttpError(404, 'Schema not found')

  res.json(listEntries(schema.id).map((entry) => toContentEntry(schema, entry)))
})

contentRouter.get('/:schemaName/:entryId', (req, res) => {
  const schema = getSchemaByName(req.params.schemaName)
  if (!schema) throw new HttpError(404, 'Schema not found')

  const entry = getEntryById(schema.id, req.params.entryId)
  if (!entry) throw new HttpError(404, 'Entry not found')

  res.json(toContentEntry(schema, entry))
})
