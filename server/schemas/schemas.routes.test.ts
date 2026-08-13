import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db/db.js'
import { createApp } from '../app.js'
import type { Entry, Schema } from '@shared/types.js'

vi.mock('../realtime/realtime.js', () => ({
  emitSchemasChanged: vi.fn(),
  emitEntriesChanged: vi.fn()
}))

async function startServer() {
  const server = createApp().listen(0)
  const { port } = server.address() as { port: number }
  return { server, baseUrl: `http://localhost:${port}` }
}

describe('schemas.routes', () => {
  beforeEach(() => {
    db.exec('DELETE FROM entries; DELETE FROM fields; DELETE FROM schemas;')
  })

  describe('POST /:id/preview', () => {
    it('returns the diff and affected entries without mutating the schema', async () => {
      const { server, baseUrl } = await startServer()

      try {
        const schemaRes = await fetch(`${baseUrl}/api/schemas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Book',
            fields: [{ name: 'title', type: 'text', required: false }]
          })
        })
        const schema = (await schemaRes.json()) as Schema
        const [titleField] = schema.fields

        const entryRes = await fetch(
          `${baseUrl}/api/schemas/${schema.id}/entries`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { [titleField.id]: 'Dune' } })
          }
        )
        const entry = (await entryRes.json()) as Entry

        const previewRes = await fetch(
          `${baseUrl}/api/schemas/${schema.id}/preview`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Book', fields: [] })
          }
        )
        const preview = (await previewRes.json()) as {
          changes: Array<{
            fieldId: string
            fieldName: string
            changeType: string
            affectedEntryIds: string[]
          }>
        }

        expect(previewRes.status).toBe(200)
        expect(preview.changes).toEqual([
          {
            fieldId: titleField.id,
            fieldName: 'title',
            changeType: 'deleted',
            affectedEntryIds: [entry.id]
          }
        ])

        const schemaAfterRes = await fetch(
          `${baseUrl}/api/schemas/${schema.id}`
        )
        const schemaAfter = (await schemaAfterRes.json()) as Schema
        expect(schemaAfter.fields).toHaveLength(1)
      } finally {
        server.close()
      }
    })
  })
})
