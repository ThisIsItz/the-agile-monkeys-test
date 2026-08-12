import type { FieldInput, Schema } from '@shared/types.js'
import { schemaSchema, schemasResponseSchema } from '@shared/validation.js'

export async function getSchemas(): Promise<Schema[]> {
  const response = await fetch('/api/schemas')

  if (!response.ok) {
    throw new Error(`Error fetching schemas: ${response.statusText}`)
  }

  const data = await response.json()
  return schemasResponseSchema.parse(data)
}

export async function createSchema(schemaInput: {
  name: string
  fields: FieldInput[]
}): Promise<Schema> {
  const response = await fetch('/api/schemas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(schemaInput)
  })

  if (!response.ok) {
    throw new Error(`Error creating schema: ${response.statusText}`)
  }

  const data = await response.json()
  return schemaSchema.parse(data)
}
