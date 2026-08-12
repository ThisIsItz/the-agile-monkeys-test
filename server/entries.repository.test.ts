import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db.js'
import { createSchema } from './schemas.repository.js'
import { createEntry, getEntryById } from './entries.repository.js'
import { HttpError } from './http-error.js'

describe('entries.repository', () => {
  beforeEach(() => {
    db.exec('DELETE FROM entries; DELETE FROM fields; DELETE FROM schemas;')
  })

  describe('createEntry', () => {
    it('persists an entry and round-trips via getEntryById', () => {
      const schema = createSchema({
        name: 'Car',
        fields: [
          { name: 'brand', type: 'text', required: true },
          { name: 'year', type: 'number', required: false }
        ]
      })
      const [brandField, yearField] = schema.fields

      const created = createEntry(schema.id, {
        data: { [brandField.id]: 'Tesla', [yearField.id]: 2024 }
      })

      const fetched = getEntryById(schema.id, created.id)

      expect(fetched?.data).toEqual({
        [brandField.id]: 'Tesla',
        [yearField.id]: 2024
      })
    })

    it('rejects data that does not conform to the schema', () => {
      const schema = createSchema({
        name: 'Car',
        fields: [{ name: 'brand', type: 'text', required: true }]
      })

      expect(() => createEntry(schema.id, { data: {} })).toThrow()
    })

    it('rejects a reference field pointing at a non-existent entry', () => {
      const personSchema = createSchema({ name: 'Person', fields: [] })
      const carSchema = createSchema({
        name: 'Car',
        fields: [
          {
            name: 'owner',
            type: 'reference',
            required: true,
            referenceTargetSchemaId: personSchema.id
          }
        ]
      })
      const [ownerField] = carSchema.fields

      let thrown: unknown
      try {
        createEntry(carSchema.id, {
          data: { [ownerField.id]: 'missing-entry-id' }
        })
      } catch (err) {
        thrown = err
      }

      expect(thrown).toBeInstanceOf(HttpError)
      expect((thrown as HttpError).status).toBe(400)
    })

    it('accepts a reference field pointing at a valid entry in the target schema', () => {
      const personSchema = createSchema({
        name: 'Person',
        fields: [{ name: 'name', type: 'text', required: true }]
      })
      const [nameField] = personSchema.fields
      const person = createEntry(personSchema.id, {
        data: { [nameField.id]: 'Alice' }
      })

      const carSchema = createSchema({
        name: 'Car',
        fields: [
          {
            name: 'owner',
            type: 'reference',
            required: true,
            referenceTargetSchemaId: personSchema.id
          }
        ]
      })
      const [ownerField] = carSchema.fields

      const car = createEntry(carSchema.id, {
        data: { [ownerField.id]: person.id }
      })

      expect(car.data[ownerField.id]).toBe(person.id)
    })
  })

  describe('getEntryById', () => {
    it('does not return an entry when queried under a different schema id', () => {
      const schemaA = createSchema({
        name: 'A',
        fields: [{ name: 'value', type: 'text', required: false }]
      })
      const schemaB = createSchema({ name: 'B', fields: [] })
      const [valueField] = schemaA.fields

      const entry = createEntry(schemaA.id, {
        data: { [valueField.id]: 'hello' }
      })

      expect(getEntryById(schemaB.id, entry.id)).toBeUndefined()
    })
  })
})
