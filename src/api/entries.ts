import type { Entry, EntryInput } from '@shared/types.js'
import { entriesResponseSchema, entrySchema } from '@shared/validation.js'
import { apiFetch, throwApiError } from './client'
import { apiEntriesPath, apiEntryPath } from './paths'

export async function getEntries(schemaId: string): Promise<Entry[]> {
  return apiFetch<Entry[]>(entriesResponseSchema, apiEntriesPath(schemaId))
}

export async function getEntry(schemaId: string, id: string): Promise<Entry> {
  return apiFetch<Entry>(entrySchema, apiEntryPath(schemaId, id))
}

export async function createEntry(
  schemaId: string,
  entryInput: EntryInput
): Promise<Entry> {
  return apiFetch<Entry>(entrySchema, apiEntriesPath(schemaId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(entryInput)
  })
}

export async function deleteEntry(schemaId: string, id: string): Promise<void> {
  const response = await fetch(apiEntryPath(schemaId, id), {
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
  return apiFetch<Entry>(entrySchema, apiEntryPath(schemaId, id), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(entryInput)
  })
}
