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
