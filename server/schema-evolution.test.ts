import { describe, expect, it } from 'vitest'
import { diffSchemaFields } from './schema-evolution.js'
import type { Field, FieldInput, Schema } from '@shared/types.js'

function makeField(overrides: Partial<Field> = {}): Field {
  return {
    id: 'field-1',
    schemaId: 'schema-1',
    name: 'title',
    type: 'text',
    required: false,
    referenceTargetSchemaId: null,
    position: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

function makeSchema(fields: Field[]): Schema {
  return {
    id: 'schema-1',
    name: 'Book',
    fields,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

function toInput(field: Field, overrides: Partial<FieldInput> = {}): FieldInput {
  return {
    id: field.id,
    name: field.name,
    type: field.type,
    required: field.required,
    referenceTargetSchemaId: field.referenceTargetSchemaId,
    ...overrides
  }
}

describe('diffSchemaFields', () => {
  it('reports no changes when the field list is unchanged', () => {
    const field = makeField()
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, { name: 'Book', fields: [toInput(field)] })

    expect(changes).toEqual([])
  })

  it('detects a renamed field', () => {
    const field = makeField({ name: 'title' })
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, {
      name: 'Book',
      fields: [toInput(field, { name: 'headline' })]
    })

    expect(changes).toEqual([
      {
        fieldId: 'field-1',
        fieldName: 'title',
        changeType: 'renamed',
        before: 'title',
        after: 'headline'
      }
    ])
  })

  it('detects a deleted field', () => {
    const field = makeField()
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, { name: 'Book', fields: [] })

    expect(changes).toEqual([
      { fieldId: 'field-1', fieldName: 'title', changeType: 'deleted' }
    ])
  })

  it('detects a retyped field', () => {
    const field = makeField({ type: 'text' })
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, {
      name: 'Book',
      fields: [toInput(field, { type: 'number' })]
    })

    expect(changes).toEqual([
      {
        fieldId: 'field-1',
        fieldName: 'title',
        changeType: 'retyped',
        before: 'text',
        after: 'number'
      }
    ])
  })

  it('detects a field made required', () => {
    const field = makeField({ required: false })
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, {
      name: 'Book',
      fields: [toInput(field, { required: true })]
    })

    expect(changes).toEqual([
      { fieldId: 'field-1', fieldName: 'title', changeType: 'made_required' }
    ])
  })

  it('does not report a field relaxed from required to optional', () => {
    const field = makeField({ required: true })
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, {
      name: 'Book',
      fields: [toInput(field, { required: false })]
    })

    expect(changes).toEqual([])
  })

  it('detects a reference target change', () => {
    const field = makeField({
      type: 'reference',
      referenceTargetSchemaId: 'schema-author'
    })
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, {
      name: 'Book',
      fields: [toInput(field, { referenceTargetSchemaId: 'schema-person' })]
    })

    expect(changes).toEqual([
      {
        fieldId: 'field-1',
        fieldName: 'title',
        changeType: 'reference_target_changed',
        before: 'schema-author',
        after: 'schema-person'
      }
    ])
  })

  it('reports retyped, not reference_target_changed, when a reference field changes type', () => {
    const field = makeField({
      type: 'reference',
      referenceTargetSchemaId: 'schema-author'
    })
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, {
      name: 'Book',
      fields: [
        toInput(field, { type: 'text', referenceTargetSchemaId: null })
      ]
    })

    expect(changes).toEqual([
      {
        fieldId: 'field-1',
        fieldName: 'title',
        changeType: 'retyped',
        before: 'reference',
        after: 'text'
      }
    ])
  })

  it('reports multiple simultaneous changes on the same field', () => {
    const field = makeField({ name: 'title', required: false })
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, {
      name: 'Book',
      fields: [toInput(field, { name: 'headline', required: true })]
    })

    expect(changes).toEqual([
      {
        fieldId: 'field-1',
        fieldName: 'title',
        changeType: 'renamed',
        before: 'title',
        after: 'headline'
      },
      { fieldId: 'field-1', fieldName: 'title', changeType: 'made_required' }
    ])
  })

  it('ignores fields with no matching id (inserts)', () => {
    const field = makeField()
    const existing = makeSchema([field])

    const changes = diffSchemaFields(existing, {
      name: 'Book',
      fields: [
        toInput(field),
        { name: 'newField', type: 'text', required: false }
      ]
    })

    expect(changes).toEqual([])
  })
})
