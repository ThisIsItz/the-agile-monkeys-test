import type { z } from 'zod'
import type { entrySchema, fieldSchema, schemaSchema } from './validation.js'

export const FIELD_TYPES = [
  'text',
  'number',
  'boolean',
  'date',
  'reference'
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

export type Field = z.infer<typeof fieldSchema>

export type Schema = z.infer<typeof schemaSchema>

export interface FieldInput {
  id?: string
  name: string
  type: FieldType
  required: boolean
  referenceTargetSchemaId?: string | null
}

export interface SchemaInput {
  name: string
  fields: FieldInput[]
}

export type EntryFieldValue = string | number | boolean | null

export type Entry = z.infer<typeof entrySchema>

export interface EntryInput {
  data: Record<string, EntryFieldValue>
}

export type FieldChange =
  | RenamedFieldChange
  | DeletedFieldChange
  | RetypedFieldChange
  | MadeRequiredFieldChange
  | ReferenceTargetChangedFieldChange

interface RenamedFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'renamed'
  before: string
  after: string
}

interface DeletedFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'deleted'
}

interface RetypedFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'retyped'
  before: Field['type']
  after: Field['type']
}

interface MadeRequiredFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'made_required'
}

interface ReferenceTargetChangedFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'reference_target_changed'
  before: string | null
  after: string | null
}

export type FieldChangeImpact = FieldChange & { affectedEntryIds: string[] }

export type SchemaPreviewResponse = {
  changes: FieldChangeImpact[]
}

export interface BlockingReference {
  schemaId: string
  schemaName: string
  fieldId: string
  fieldName: string
}

export interface SchemaDeletionImpact {
  schemaId: string
  affectedEntryIds: string[]
  blockingReferences: BlockingReference[]
}
