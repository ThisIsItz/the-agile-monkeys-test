import { z } from 'zod'
import { FIELD_TYPES } from '../shared/types.js'

export const fieldInputSchema = z
  .object({
    id: z.string().min(1).optional(),
    name: z.string().trim().min(1).max(100),
    type: z.enum(FIELD_TYPES),
    required: z.boolean().default(false),
    referenceTargetSchemaId: z.string().min(1).optional().nullable()
  })
  .refine(
    (field) => field.type !== 'reference' || !!field.referenceTargetSchemaId,
    {
      message: 'referenceTargetSchemaId is required when type is "reference"',
      path: ['referenceTargetSchemaId']
    }
  )

export const schemaInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    fields: z.array(fieldInputSchema)
  })
  .refine(
    (schema) => {
      const names = schema.fields.map((f) => f.name.toLowerCase())
      return new Set(names).size === names.length
    },
    { message: 'Field names must be unique within a schema', path: ['fields'] }
  )
