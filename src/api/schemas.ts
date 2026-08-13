import type { Schema, SchemaInput } from '@shared/types.js'
import { schemaSchema, schemasResponseSchema } from '@shared/validation.js'
import { apiFetch, throwApiError } from './client'

export async function getSchemas(): Promise<Schema[]> {
  return apiFetch<Schema[]>(schemasResponseSchema, '/api/schemas')
}

export async function getSchema(id: string): Promise<Schema> {
  return apiFetch<Schema>(schemaSchema, `/api/schemas/${id}`)
}

export async function createSchema(schemaInput: SchemaInput): Promise<Schema> {
  return apiFetch<Schema>(schemaSchema, '/api/schemas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(schemaInput)
  })
}

export async function deleteSchema(id: string): Promise<void> {
  const response = await fetch(`/api/schemas/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    await throwApiError(response)
  }
}

export async function updateSchema(
  id: string,
  schemaInput: SchemaInput
): Promise<Schema> {
  return apiFetch<Schema>(schemaSchema, `/api/schemas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(schemaInput)
  })
}
