export const SCHEMAS_ROUTE = '/schemas'
export const NEW_SCHEMA_ROUTE = '/schemas/new'
export const SCHEMA_EDIT_ROUTE = '/schemas/:id/edit'
export const ENTRIES_ROUTE = '/schemas/:schemaId/entries'
export const NEW_ENTRY_ROUTE = '/schemas/:schemaId/entries/new'
export const ENTRY_EDIT_ROUTE = '/schemas/:schemaId/entries/:entryId/edit'

export function schemaEditPath(schemaId: string): string {
  return `/schemas/${schemaId}/edit`
}

export function entriesPath(schemaId: string): string {
  return `/schemas/${schemaId}/entries`
}

export function newEntryPath(schemaId: string): string {
  return `/schemas/${schemaId}/entries/new`
}

export function entryEditPath(schemaId: string, entryId: string): string {
  return `/schemas/${schemaId}/entries/${entryId}/edit`
}
