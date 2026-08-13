import type { Entry, EntryInput } from '@shared/types.js'
import { entriesResponseSchema, entrySchema } from '@shared/validation.js'
import { apiFetch, throwApiError } from './client'

export async function getEntries(schemaId: string): Promise<Entry[]> {
  return apiFetch<Entry[]>(
    entriesResponseSchema,
    `/api/schemas/${schemaId}/entries`
  )
}

export async function getEntry(schemaId: string, id: string): Promise<Entry> {
  return apiFetch<Entry>(entrySchema, `/api/schemas/${schemaId}/entries/${id}`)
}

export async function createEntry(
  schemaId: string,
  entryInput: EntryInput
): Promise<Entry> {
  return apiFetch<Entry>(entrySchema, `/api/schemas/${schemaId}/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(entryInput)
  })
}

export async function deleteEntry(schemaId: string, id: string): Promise<void> {
  const response = await fetch(`/api/schemas/${schemaId}/entries/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    await throwApiError(response)
  }
}

export async function updateEntry(
  schemaId: string,
  id: string,
  entryInput: EntryInput
): Promise<Entry> {
  return apiFetch<Entry>(
    entrySchema,
    `/api/schemas/${schemaId}/entries/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entryInput)
    }
  )
}
