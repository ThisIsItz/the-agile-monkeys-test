import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from './db.js'
import { createApp } from './app.js'
import * as realtime from './realtime.js'
import type { Entry, Schema } from '@shared/types.js'

vi.mock('./realtime.js', () => ({
  emitSchemasChanged: vi.fn(),
  emitEntriesChanged: vi.fn()
}))

async function startServer() {
  const server = createApp().listen(0)
  const { port } = server.address() as { port: number }
  return { server, baseUrl: `http://localhost:${port}` }
}

describe('entries.routes', () => {
  beforeEach(() => {
    db.exec('DELETE FROM entries; DELETE FROM fields; DELETE FROM schemas;')
    vi.mocked(realtime.emitEntriesChanged).mockClear()
  })

  it('emits entries:changed with the schema id and the created entry id', async () => {
    const { server, baseUrl } = await startServer()

    try {
      const schemaRes = await fetch(`${baseUrl}/api/schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Car',
          fields: [{ name: 'brand', type: 'text', required: true }]
        })
      })
      const schema = (await schemaRes.json()) as Schema

      const entryRes = await fetch(
        `${baseUrl}/api/schemas/${schema.id}/entries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { [schema.fields[0].id]: 'Tesla' }
          })
        }
      )
      const entry = (await entryRes.json()) as Entry

      expect(realtime.emitEntriesChanged).toHaveBeenCalledWith(
        schema.id,
        entry.id
      )
    } finally {
      server.close()
    }
  })
})
