import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db/db.js'
import { createEntry } from '@server/entries/entries.repository.js'
import { createSchema } from '@server/schemas/schemas.repository.js'
import {
  diffSchemaFields,
  findAffectedEntries,
  previewSchemaDeletion
} from './schema-evolution.js'
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

describe('findAffectedEntries', () => {
  beforeEach(() => {
    db.exec('DELETE FROM entries; DELETE FROM fields; DELETE FROM schemas;')
  })

  function impactFor(
    impacts: ReturnType<typeof findAffectedEntries>,
    changeType: string
  ) {
    const impact = impacts.find((c) => c.changeType === changeType)
    if (!impact) throw new Error(`No "${changeType}" change found`)
    return impact
  }

  it('reports no affected entries for a renamed field', () => {
    const schema = createSchema({
      name: 'Book',
      fields: [{ name: 'title', type: 'text', required: false }]
    })
    const [titleField] = schema.fields
    createEntry(schema.id, { data: { [titleField.id]: 'Dune' } })

    const input = {
      name: 'Book',
      fields: [toInput(titleField, { name: 'headline' })]
    }
    const changes = diffSchemaFields(schema, input)
    const impacts = findAffectedEntries(schema, changes, input)

    expect(impactFor(impacts, 'renamed').affectedEntries).toEqual([])
  })

  it('affects entries with a value for a deleted field, not entries without one', () => {
    const schema = createSchema({
      name: 'Book',
      fields: [{ name: 'title', type: 'text', required: false }]
    })
    const [titleField] = schema.fields
    const withValue = createEntry(schema.id, {
      data: { [titleField.id]: 'Dune' }
    })
    createEntry(schema.id, { data: {} })

    const input = { name: 'Book', fields: [] }
    const changes = diffSchemaFields(schema, input)
    const impacts = findAffectedEntries(schema, changes, input)

    expect(impactFor(impacts, 'deleted').affectedEntries).toEqual([
      { id: withValue.id, label: 'Dune' }
    ])
  })

  it('affects entries whose stored value no longer matches the new type', () => {
    const schema = createSchema({
      name: 'Book',
      fields: [{ name: 'pages', type: 'text', required: false }]
    })
    const [pagesField] = schema.fields
    const entry = createEntry(schema.id, {
      data: { [pagesField.id]: 'not-a-number' }
    })

    const input = {
      name: 'Book',
      fields: [toInput(pagesField, { type: 'number' })]
    }
    const changes = diffSchemaFields(schema, input)
    const impacts = findAffectedEntries(schema, changes, input)

    expect(impactFor(impacts, 'retyped').affectedEntries).toEqual([
      { id: entry.id, label: 'not-a-number' }
    ])
  })

  it('when retyped to reference, only affects entries whose value does not point at a real entry in the new target', () => {
    const target = createSchema({ name: 'Author', fields: [] })
    const realAuthor = createEntry(target.id, { data: {} })

    const schema = createSchema({
      name: 'Book',
      fields: [{ name: 'author', type: 'text', required: false }]
    })
    const [authorField] = schema.fields
    const validReference = createEntry(schema.id, {
      data: { [authorField.id]: realAuthor.id }
    })
    const danglingReference = createEntry(schema.id, {
      data: { [authorField.id]: 'not-a-real-entry-id' }
    })

    const input = {
      name: 'Book',
      fields: [
        toInput(authorField, {
          type: 'reference',
          referenceTargetSchemaId: target.id
        })
      ]
    }
    const changes = diffSchemaFields(schema, input)
    const impacts = findAffectedEntries(schema, changes, input)

    expect(impactFor(impacts, 'retyped').affectedEntries).toEqual([
      { id: danglingReference.id, label: 'not-a-real-entry-id' }
    ])
    expect(
      impactFor(impacts, 'retyped').affectedEntries.map((entry) => entry.id)
    ).not.toContain(validReference.id)
  })

  it('affects entries missing a value for a field made required, not entries with one', () => {
    const schema = createSchema({
      name: 'Book',
      fields: [{ name: 'subtitle', type: 'text', required: false }]
    })
    const [subtitleField] = schema.fields
    const withoutValue = createEntry(schema.id, { data: {} })
    createEntry(schema.id, { data: { [subtitleField.id]: 'A Novel' } })

    const input = {
      name: 'Book',
      fields: [toInput(subtitleField, { required: true })]
    }
    const changes = diffSchemaFields(schema, input)
    const impacts = findAffectedEntries(schema, changes, input)

    expect(impactFor(impacts, 'made_required').affectedEntries).toEqual([
      { id: withoutValue.id, label: `${withoutValue.id.slice(0, 8)}…` }
    ])
  })

  it('affects entries with an empty string for a text field made required, matching normal validation', () => {
    const schema = createSchema({
      name: 'Book',
      fields: [{ name: 'subtitle', type: 'text', required: false }]
    })
    const [subtitleField] = schema.fields
    const emptyString = createEntry(schema.id, {
      data: { [subtitleField.id]: '' }
    })

    const input = {
      name: 'Book',
      fields: [toInput(subtitleField, { required: true })]
    }
    const changes = diffSchemaFields(schema, input)
    const impacts = findAffectedEntries(schema, changes, input)

    expect(impactFor(impacts, 'made_required').affectedEntries).toEqual([
      { id: emptyString.id, label: `${emptyString.id.slice(0, 8)}…` }
    ])
  })

  it('affects entries whose reference no longer exists in the new target schema', () => {
    const oldTarget = createSchema({ name: 'Author', fields: [] })
    const oldTargetEntry = createEntry(oldTarget.id, { data: {} })
    const newTarget = createSchema({ name: 'Publisher', fields: [] })

    const schema = createSchema({
      name: 'Book',
      fields: [
        {
          name: 'author',
          type: 'reference',
          required: false,
          referenceTargetSchemaId: oldTarget.id
        }
      ]
    })
    const [authorField] = schema.fields
    const entry = createEntry(schema.id, {
      data: { [authorField.id]: oldTargetEntry.id }
    })

    const input = {
      name: 'Book',
      fields: [
        toInput(authorField, { referenceTargetSchemaId: newTarget.id })
      ]
    }
    const changes = diffSchemaFields(schema, input)
    const impacts = findAffectedEntries(schema, changes, input)

    expect(
      impactFor(impacts, 'reference_target_changed').affectedEntries
    ).toEqual([{ id: entry.id, label: `${entry.id.slice(0, 8)}…` }])
  })

  it('computes affected entries independently per field when changes are combined', () => {
    const schema = createSchema({
      name: 'Book',
      fields: [
        { name: 'a', type: 'text', required: false },
        { name: 'b', type: 'text', required: false }
      ]
    })
    const [fieldA, fieldB] = schema.fields
    const entryWithA = createEntry(schema.id, {
      data: { [fieldA.id]: 'value-a', [fieldB.id]: 'value-b' }
    })
    const entryWithB = createEntry(schema.id, { data: {} })

    const input = {
      name: 'Book',
      fields: [toInput(fieldB, { required: true })]
    }
    const changes = diffSchemaFields(schema, input)
    const impacts = findAffectedEntries(schema, changes, input)

    expect(impactFor(impacts, 'deleted').affectedEntries).toEqual([
      { id: entryWithA.id, label: 'value-a' }
    ])
    expect(impactFor(impacts, 'made_required').affectedEntries).toEqual([
      { id: entryWithB.id, label: `${entryWithB.id.slice(0, 8)}…` }
    ])
  })
})

describe('previewSchemaDeletion', () => {
  beforeEach(() => {
    db.exec('DELETE FROM entries; DELETE FROM fields; DELETE FROM schemas;')
  })

  it('reports all of the schema entries as affected when nothing blocks deletion', () => {
    const schema = createSchema({
      name: 'Book',
      fields: [{ name: 'title', type: 'text', required: false }]
    })
    const [titleField] = schema.fields
    const entryA = createEntry(schema.id, {
      data: { [titleField.id]: 'Dune' }
    })
    const entryB = createEntry(schema.id, { data: {} })

    const impact = previewSchemaDeletion(schema.id)

    expect(impact.affectedEntryIds.sort()).toEqual(
      [entryA.id, entryB.id].sort()
    )
    expect(impact.blockingReferences).toEqual([])
  })

  it('reports no affected entries or blocking references for a schema with none', () => {
    const schema = createSchema({ name: 'Empty', fields: [] })

    const impact = previewSchemaDeletion(schema.id)

    expect(impact.affectedEntryIds).toEqual([])
    expect(impact.blockingReferences).toEqual([])
  })

  it('reports a blocking reference when another schema still points at it', () => {
    const target = createSchema({ name: 'Author', fields: [] })
    const referencing = createSchema({
      name: 'Book',
      fields: [
        {
          name: 'author',
          type: 'reference',
          required: false,
          referenceTargetSchemaId: target.id
        }
      ]
    })
    const [authorField] = referencing.fields

    const impact = previewSchemaDeletion(target.id)

    expect(impact.blockingReferences).toEqual([
      {
        schemaId: referencing.id,
        schemaName: 'Book',
        fieldId: authorField.id,
        fieldName: 'author'
      }
    ])
  })
})
