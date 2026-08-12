import { describe, expect, it } from 'vitest'
import { schemaInputSchema } from './validation.js'

describe('schemaInputSchema', () => {
  it('accepts a schema with one field of each type', () => {
    const result = schemaInputSchema.safeParse({
      name: 'Car',
      fields: [
        { name: 'brand', type: 'text', required: true },
        { name: 'year', type: 'number', required: true },
        { name: 'available', type: 'boolean', required: false },
        { name: 'registeredAt', type: 'date', required: false },
        { name: 'owner', type: 'reference', required: true, referenceTargetSchemaId: 'person-schema-id' },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fields).toHaveLength(5)
    }
  })

  it('rejects a reference field missing referenceTargetSchemaId', () => {
    const result = schemaInputSchema.safeParse({
      name: 'Car',
      fields: [{ name: 'owner', type: 'reference', required: true }],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message.includes('referenceTargetSchemaId is required')),
      ).toBe(true)
    }
  })

  it('rejects duplicate field names within a schema (case-insensitive)', () => {
    const result = schemaInputSchema.safeParse({
      name: 'Car',
      fields: [
        { name: 'Name', type: 'text', required: false },
        { name: 'name', type: 'text', required: false },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Field names must be unique within a schema'),
      ).toBe(true)
    }
  })
})
