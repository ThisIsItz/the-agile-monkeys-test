import type { EntryFieldValue, Schema } from '@shared/types'

export function normalizeEntryData(
  schema: Schema,
  data: Record<string, EntryFieldValue>
): Record<string, EntryFieldValue> {
  const normalized = { ...data }

  for (const field of schema.fields) {
    if (field.type !== 'text' && normalized[field.id] === '') {
      normalized[field.id] = null
    }
  }

  return normalized
}
