import { z } from 'zod'
import { FIELD_TYPES } from './types.js'

export const fieldSchema = z.object({
  id: z.string(),
  schemaId: z.string(),
  name: z.string(),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  referenceTargetSchemaId: z.string().nullable(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const schemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(fieldSchema),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const schemasResponseSchema = z.array(schemaSchema)

export const entryFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
])

export const entrySchema = z.object({
  id: z.string(),
  schemaId: z.string(),
  data: z.record(z.string(), entryFieldValueSchema),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const entriesResponseSchema = z.array(entrySchema)
