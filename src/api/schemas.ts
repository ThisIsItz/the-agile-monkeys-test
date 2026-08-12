import type { Schema, SchemaInput } from '@shared/types.js'
import { schemaSchema, schemasResponseSchema } from '@shared/validation.js'

export async function getSchemas(): Promise<Schema[]> {
  const response = await fetch('/api/schemas')

  if (!response.ok) {
    throw new Error(`Error fetching schemas: ${response.statusText}`)
  }

  const data = await response.json()
  return schemasResponseSchema.parse(data)
}

export async function createSchema(schemaInput: SchemaInput): Promise<Schema> {
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

export async function deleteSchema(id: string): Promise<void> {
  const response = await fetch(`/api/schemas/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error(`Error deleting schema: ${response.statusText}`)
  }
}

export async function updateSchema(
  id: string,
  schemaInput: SchemaInput
): Promise<Schema> {
  const response = await fetch(`/api/schemas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(schemaInput)
  })

  if (!response.ok) {
    throw new Error(`Error updating schema: ${response.statusText}`)
  }

  const data = await response.json()
  return schemaSchema.parse(data)
}
