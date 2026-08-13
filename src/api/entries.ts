import type { Entry, EntryInput } from '@shared/types.js'
import { entriesResponseSchema, entrySchema } from '@shared/validation.js'
import { throwApiError } from './client'

export async function getEntries(schemaId: string): Promise<Entry[]> {
  const response = await fetch(`/api/schemas/${schemaId}/entries`)

  if (!response.ok) {
    await throwApiError(response)
  }

  const data = await response.json()
  return entriesResponseSchema.parse(data)
}

export async function getEntry(schemaId: string, id: string): Promise<Entry> {
  const response = await fetch(`/api/schemas/${schemaId}/entries/${id}`)

  if (!response.ok) {
    await throwApiError(response)
  }

  const data = await response.json()
  return entrySchema.parse(data)
}

export async function createEntry(
  schemaId: string,
  entryInput: EntryInput
): Promise<Entry> {
  const response = await fetch(`/api/schemas/${schemaId}/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(entryInput)
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const data = await response.json()
  return entrySchema.parse(data)
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
  const response = await fetch(`/api/schemas/${schemaId}/entries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(entryInput)
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const data = await response.json()
  return entrySchema.parse(data)
}
