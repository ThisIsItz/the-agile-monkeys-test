import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@server/db/db.js'
import { createApp } from '@server/app.js'

async function startServer() {
  const server = createApp().listen(0)
  const { port } = server.address() as { port: number }
  return { server, baseUrl: `http://localhost:${port}` }
}

async function createSchema(baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/schemas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Car',
      fields: [
        { name: 'brand', type: 'text', required: true },
        { name: 'year', type: 'number', required: false }
      ]
    })
  })
  return (await res.json()) as {
    id: string
    fields: Array<{ id: string; name: string }>
  }
}

async function createEntry(
  baseUrl: string,
  schemaId: string,
  data: Record<string, unknown>
) {
  const res = await fetch(`${baseUrl}/api/schemas/${schemaId}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  })
  return (await res.json()) as { id: string }
}

describe('content.routes', () => {
  beforeEach(() => {
    db.exec('DELETE FROM entries; DELETE FROM fields; DELETE FROM schemas;')
  })

  it('returns entries with data keyed by field name, not id', async () => {
    const { server, baseUrl } = await startServer()

    try {
      const schema = await createSchema(baseUrl)
      const brandField = schema.fields.find((f) => f.name === 'brand')!
      const yearField = schema.fields.find((f) => f.name === 'year')!
      await createEntry(baseUrl, schema.id, {
        [brandField.id]: 'Tesla',
        [yearField.id]: 2024
      })

      const res = await fetch(`${baseUrl}/api/content/Car`)
      const body = (await res.json()) as Array<{
        data: Record<string, unknown>
      }>

      expect(body).toHaveLength(1)
      expect(body[0].data).toEqual({ brand: 'Tesla', year: 2024 })
    } finally {
      server.close()
    }
  })

  it('returns 404 for an unknown schema name', async () => {
    const { server, baseUrl } = await startServer()

    try {
      const res = await fetch(`${baseUrl}/api/content/DoesNotExist`)
      expect(res.status).toBe(404)
    } finally {
      server.close()
    }
  })

  it('fetches a single entry by id, name-keyed, and 404s for an unknown entry id', async () => {
    const { server, baseUrl } = await startServer()

    try {
      const schema = await createSchema(baseUrl)
      const brandField = schema.fields.find((f) => f.name === 'brand')!
      const entry = await createEntry(baseUrl, schema.id, {
        [brandField.id]: 'Tesla'
      })

      const found = await fetch(`${baseUrl}/api/content/Car/${entry.id}`)
      expect(found.status).toBe(200)
      const foundBody = (await found.json()) as {
        data: Record<string, unknown>
      }
      expect(foundBody.data.brand).toBe('Tesla')

      const missing = await fetch(`${baseUrl}/api/content/Car/missing-id`)
      expect(missing.status).toBe(404)
    } finally {
      server.close()
    }
  })
})
