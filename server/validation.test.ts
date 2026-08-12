import { describe, expect, it } from 'vitest'
import { buildEntryDataSchema, schemaInputSchema } from './validation.js'
import type { Schema } from '../shared/types.js'

const carSchema: Schema = {
  id: 'car-schema',
  name: 'Car',
  fields: [
    {
      id: 'f-brand',
      schemaId: 'car-schema',
      name: 'brand',
      type: 'text',
      required: true,
      referenceTargetSchemaId: null,
      position: 0,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'f-year',
      schemaId: 'car-schema',
      name: 'year',
      type: 'number',
      required: true,
      referenceTargetSchemaId: null,
      position: 1,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'f-available',
      schemaId: 'car-schema',
      name: 'available',
      type: 'boolean',
      required: false,
      referenceTargetSchemaId: null,
      position: 2,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'f-registeredAt',
      schemaId: 'car-schema',
      name: 'registeredAt',
      type: 'date',
      required: false,
      referenceTargetSchemaId: null,
      position: 3,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'f-owner',
      schemaId: 'car-schema',
      name: 'owner',
      type: 'reference',
      required: true,
      referenceTargetSchemaId: 'person-schema',
      position: 4,
      createdAt: '',
      updatedAt: ''
    }
  ],
  createdAt: '',
  updatedAt: ''
}

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

describe('buildEntryDataSchema', () => {
  it('accepts valid data with one field of each type', () => {
    const result = buildEntryDataSchema(carSchema).safeParse({
      'f-brand': 'Tesla',
      'f-year': 2024,
      'f-available': true,
      'f-registeredAt': '2024-01-01',
      'f-owner': 'person-1'
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const result = buildEntryDataSchema(carSchema).safeParse({
      'f-year': 2024,
      'f-available': true,
      'f-registeredAt': '2024-01-01',
      'f-owner': 'person-1'
    })

    expect(result.success).toBe(false)
  })

  it('rejects a key that is not declared on the schema', () => {
    const result = buildEntryDataSchema(carSchema).safeParse({
      'f-brand': 'Tesla',
      'f-year': 2024,
      'f-available': true,
      'f-registeredAt': '2024-01-01',
      'f-owner': 'person-1',
      'unknown-field': 'oops'
    })

    expect(result.success).toBe(false)
  })
})
