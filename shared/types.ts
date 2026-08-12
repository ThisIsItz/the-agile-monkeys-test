export const FIELD_TYPES = [
  'text',
  'number',
  'boolean',
  'date',
  'reference'
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

export interface Field {
  id: string
  schemaId: string
  name: string
  type: FieldType
  required: boolean
  referenceTargetSchemaId: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface Schema {
  id: string
  name: string
  fields: Field[]
  createdAt: string
  updatedAt: string
}

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
