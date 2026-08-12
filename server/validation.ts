import { z } from 'zod'
import { FIELD_TYPES } from '../shared/types.js'
import type { Field, Schema } from '../shared/types.js'
import { entryFieldValueSchema } from '../shared/validation.js'

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

export const entryInputSchema = z.object({
  data: z.record(z.string(), entryFieldValueSchema)
})

function fieldValueSchema(field: Field): z.ZodTypeAny {
  switch (field.type) {
    case 'text':
      return field.required ? z.string().min(1) : z.string()
    case 'number':
      return z.number()
    case 'boolean':
      return z.boolean()
    case 'date':
      return z.iso.date()
    case 'reference':
      return z.string().min(1)
  }
}

export function buildEntryDataSchema(schema: Schema): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of schema.fields) {
    const valueSchema = fieldValueSchema(field)
    shape[field.id] = field.required
      ? valueSchema
      : valueSchema.nullable().optional()
  }
  return z.object(shape).strict()
}
