import { Router } from 'express'
import type { Request } from 'express'
import * as repo from './entries.repository.js'
import { entryInputSchema } from './validation.js'
import { HttpError } from './http-error.js'
import { emitEntriesChanged } from './realtime.js'

export const entriesRouter = Router({ mergeParams: true })

entriesRouter.get('/', (req: Request<{ schemaId: string }>, res) => {
  res.json(repo.listEntries(req.params.schemaId))
})

entriesRouter.get(
  '/:id',
  (req: Request<{ schemaId: string; id: string }>, res) => {
    const entry = repo.getEntryById(req.params.schemaId, req.params.id)
    if (!entry) throw new HttpError(404, 'Entry not found')
    res.json(entry)
  }
)

entriesRouter.post('/', (req: Request<{ schemaId: string }>, res) => {
  const input = entryInputSchema.parse(req.body)
  const entry = repo.createEntry(req.params.schemaId, input)
  emitEntriesChanged(req.params.schemaId, entry.id)
  res.status(201).json(entry)
})

entriesRouter.put(
  '/:id',
  (req: Request<{ schemaId: string; id: string }>, res) => {
    const input = entryInputSchema.parse(req.body)
    const entry = repo.updateEntry(req.params.schemaId, req.params.id, input)
    emitEntriesChanged(req.params.schemaId, req.params.id)
    res.json(entry)
  }
)

entriesRouter.delete(
  '/:id',
  (req: Request<{ schemaId: string; id: string }>, res) => {
    repo.deleteEntry(req.params.schemaId, req.params.id)
    emitEntriesChanged(req.params.schemaId, req.params.id)
    res.status(204).send()
  }
)
