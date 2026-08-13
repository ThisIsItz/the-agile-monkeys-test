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
            affectedEntries: Array<{ id: string; label: string }>
          }>
        }

        expect(previewRes.status).toBe(200)
        expect(preview.changes).toEqual([
          {
            fieldId: titleField.id,
            fieldName: 'title',
            changeType: 'deleted',
            affectedEntries: [{ id: entry.id, label: 'Dune' }]
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

  describe('GET /:id/delete-preview', () => {
    it('returns the affected entries for a deletable schema', async () => {
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
          `${baseUrl}/api/schemas/${schema.id}/delete-preview`
        )
        const preview = (await previewRes.json()) as {
          schemaId: string
          affectedEntryIds: string[]
          blockingReferences: unknown[]
        }

        expect(previewRes.status).toBe(200)
        expect(preview).toEqual({
          schemaId: schema.id,
          affectedEntryIds: [entry.id],
          blockingReferences: []
        })
      } finally {
        server.close()
      }
    })

    it('returns 404 for a schema that does not exist', async () => {
      const { server, baseUrl } = await startServer()

      try {
        const res = await fetch(
          `${baseUrl}/api/schemas/does-not-exist/delete-preview`
        )

        expect(res.status).toBe(404)
      } finally {
        server.close()
      }
    })

    it('returns 200 with blocking references when another schema still points at it', async () => {
      const { server, baseUrl } = await startServer()

      try {
        const targetRes = await fetch(`${baseUrl}/api/schemas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Author', fields: [] })
        })
        const target = (await targetRes.json()) as Schema

        const referencingRes = await fetch(`${baseUrl}/api/schemas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Book',
            fields: [
              {
                name: 'author',
                type: 'reference',
                required: false,
                referenceTargetSchemaId: target.id
              }
            ]
          })
        })
        const referencing = (await referencingRes.json()) as Schema
        const [authorField] = referencing.fields

        const previewRes = await fetch(
          `${baseUrl}/api/schemas/${target.id}/delete-preview`
        )
        const preview = (await previewRes.json()) as {
          schemaId: string
          affectedEntryIds: string[]
          blockingReferences: Array<{
            schemaId: string
            schemaName: string
            fieldId: string
            fieldName: string
          }>
        }

        expect(previewRes.status).toBe(200)
        expect(preview.blockingReferences).toEqual([
          {
            schemaId: referencing.id,
            schemaName: 'Book',
            fieldId: authorField.id,
            fieldName: 'author'
          }
        ])
      } finally {
        server.close()
      }
    })
  })
})
