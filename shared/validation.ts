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

const fieldChangeBaseSchema = z.object({
  fieldId: z.string(),
  fieldName: z.string(),
  affectedEntryIds: z.array(z.string())
})

export const fieldChangeImpactSchema = z.discriminatedUnion('changeType', [
  fieldChangeBaseSchema.extend({
    changeType: z.literal('renamed'),
    before: z.string(),
    after: z.string()
  }),
  fieldChangeBaseSchema.extend({
    changeType: z.literal('deleted')
  }),
  fieldChangeBaseSchema.extend({
    changeType: z.literal('retyped'),
    before: z.enum(FIELD_TYPES),
    after: z.enum(FIELD_TYPES)
  }),
  fieldChangeBaseSchema.extend({
    changeType: z.literal('made_required')
  }),
  fieldChangeBaseSchema.extend({
    changeType: z.literal('reference_target_changed'),
    before: z.string().nullable(),
    after: z.string().nullable()
  })
])

export const schemaPreviewResponseSchema = z.object({
  changes: z.array(fieldChangeImpactSchema)
})
