import type { Entry, Schema } from './types.js'

export const getEntryLabel = (entry: Entry, schema: Schema): string => {
  const textField = schema.fields.find((field) => {
    if (field.type !== 'text') return false

    const value = entry.data[field.id]
    return typeof value === 'string' && value !== ''
  })

  if (textField) {
    return String(entry.data[textField.id])
  }

  return `${entry.id.slice(0, 8)}…`
}
