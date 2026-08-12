import { Router } from 'express'
import * as repo from './schemas.repository.js'
import { schemaInputSchema } from './validation.js'
import { HttpError } from './http-error.js'

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
  res.status(201).json(repo.createSchema(input))
})

schemasRouter.put('/:id', (req, res) => {
  const input = schemaInputSchema.parse(req.body)
  res.json(repo.updateSchema(req.params.id, input))
})

schemasRouter.delete('/:id', (req, res) => {
  repo.deleteSchema(req.params.id)
  res.status(204).send()
})
