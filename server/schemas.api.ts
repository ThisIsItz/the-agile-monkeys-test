import type { Schema } from '@shared/types.js'
import { schemasResponseSchema } from '@shared/validation.js'

export async function getSchemas(): Promise<Schema[]> {
  const response = await fetch('/api/schemas')

  if (!response.ok) {
    throw new Error(`Error fetching schemas: ${response.statusText}`)
  }

  const data = await response.json()
  return schemasResponseSchema.parse(data)
}
