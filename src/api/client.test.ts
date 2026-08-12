import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './client'

describe('getErrorMessage', () => {
  it('returns the server error message when present', async () => {
    const response = new Response(JSON.stringify({ error: 'Schema not found' }), {
      status: 404,
      statusText: 'Not Found'
    })

    await expect(getErrorMessage(response)).resolves.toBe('Schema not found')
  })

  it('falls back to statusText when the body is not the expected shape', async () => {
    const response = new Response('not json', {
      status: 500,
      statusText: 'Internal Server Error'
    })

    await expect(getErrorMessage(response)).resolves.toBe('Internal Server Error')
  })
})
