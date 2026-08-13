export function apiSchemasPath(): string {
  return '/api/schemas'
}

export function apiSchemaPath(id: string): string {
  return `/api/schemas/${id}`
}

export function apiEntriesPath(schemaId: string): string {
  return `/api/schemas/${schemaId}/entries`
}

export function apiEntryPath(schemaId: string, id: string): string {
  return `/api/schemas/${schemaId}/entries/${id}`
}
