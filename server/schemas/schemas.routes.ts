import { Router } from 'express'
import * as repo from './schemas.repository.js'
import { HttpError } from '@server/http-error.js'
import { schemaInputSchema } from '@server/validation.js'
import { emitSchemasChanged } from '@server/realtime/realtime.js'
import {
  diffSchemaFields,
  findAffectedEntries,
  previewSchemaDeletion
} from '@server/schema-evolution.js'

export const schemasRouter = Router()

schemasRouter.get('/', (_req, res) => {
  res.json(repo.listSchemas())
})

schemasRouter.get('/:id', (req, res) => {
  const schema = repo.getSchemaById(req.params.id)
  if (!schema) throw new HttpError(404, 'Schema not found')
  res.json(schema)
})

schemasRouter.post('/', (req, res) => {
  const input = schemaInputSchema.parse(req.body)
  const schema = repo.createSchema(input)
  emitSchemasChanged(schema.id)
  res.status(201).json(schema)
})

schemasRouter.post('/:id/preview', (req, res) => {
  const input = schemaInputSchema.parse(req.body)
  const existing = repo.getSchemaById(req.params.id)
  if (!existing) throw new HttpError(404, 'Schema not found')

  const changes = diffSchemaFields(existing, input)
  const impacts = findAffectedEntries(existing.id, changes, input)

  res.json({ changes: impacts })
})

schemasRouter.get('/:id/delete-preview', (req, res) => {
  const existing = repo.getSchemaById(req.params.id)
  if (!existing) throw new HttpError(404, 'Schema not found')

  res.json(previewSchemaDeletion(existing.id))
})

schemasRouter.put('/:id', (req, res) => {
  const input = schemaInputSchema.parse(req.body)
  const schema = repo.updateSchema(req.params.id, input)
  emitSchemasChanged(schema.id)
  res.json(schema)
})

schemasRouter.delete('/:id', (req, res) => {
  repo.deleteSchema(req.params.id)
  emitSchemasChanged(req.params.id)
  res.status(204).send()
})
