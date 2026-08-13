import type {
  Schema,
  SchemaInput,
  SchemaPreviewResponse
} from '@shared/types.js'
import {
  schemaPreviewResponseSchema,
  schemaSchema,
  schemasResponseSchema
} from '@shared/validation.js'
import { apiFetch, throwApiError } from './client'
import { apiSchemaPath, apiSchemaPreviewPath, apiSchemasPath } from './paths'

export async function getSchemas(): Promise<Schema[]> {
  return apiFetch<Schema[]>(schemasResponseSchema, apiSchemasPath())
}

export async function getSchema(id: string): Promise<Schema> {
  return apiFetch<Schema>(schemaSchema, apiSchemaPath(id))
}

export async function createSchema(schemaInput: SchemaInput): Promise<Schema> {
  return apiFetch<Schema>(schemaSchema, apiSchemasPath(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(schemaInput)
  })
}

export async function deleteSchema(id: string): Promise<void> {
  const response = await fetch(apiSchemaPath(id), {
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
  return apiFetch<Schema>(schemaSchema, apiSchemaPath(id), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(schemaInput)
  })
}

export async function previewSchemaChange(
  id: string,
  schemaInput: SchemaInput
): Promise<SchemaPreviewResponse> {
  return apiFetch<SchemaPreviewResponse>(
    schemaPreviewResponseSchema,
    apiSchemaPreviewPath(id),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(schemaInput)
    }
  )
}
