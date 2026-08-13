import { beforeEach, describe, expect, it } from 'vitest'
import {
  createSchema,
  getSchemaById,
  getSchemaByName,
  updateSchema
} from './schemas.repository.js'
import { db } from '@server/db/db.js'
import { HttpError } from '@server/http-error.js'

describe('schemas.repository', () => {
  beforeEach(() => {
    db.exec('DELETE FROM fields; DELETE FROM schemas;')
  })

  describe('createSchema', () => {
    it('persists a schema and its fields, round-tripping via getSchemaById', () => {
      const created = createSchema({
        name: 'Car',
        fields: [
          { name: 'brand', type: 'text', required: true },
          { name: 'year', type: 'number', required: false }
        ]
      })

      const fetched = getSchemaById(created.id)

      expect(fetched?.name).toBe('Car')
      expect(fetched?.fields.map((field) => field.name)).toEqual([
        'brand',
        'year'
      ])
    })

    it('rejects a duplicate schema name (case-insensitive)', () => {
      createSchema({ name: 'Car', fields: [] })

      let thrown: unknown
      try {
        createSchema({ name: 'car', fields: [] })
      } catch (err) {
        thrown = err
      }

      expect(thrown).toBeInstanceOf(HttpError)
      expect((thrown as HttpError).status).toBe(409)
    })

    it('rejects a reference field pointing at a non-existent schema', () => {
      let thrown: unknown
      try {
        createSchema({
          name: 'Car',
          fields: [
            {
              name: 'owner',
              type: 'reference',
              required: false,
              referenceTargetSchemaId: 'missing-id'
            }
          ]
        })
      } catch (err) {
        thrown = err
      }

      expect(thrown).toBeInstanceOf(HttpError)
      expect((thrown as HttpError).status).toBe(400)
    })
  })

  describe('getSchemaByName', () => {
    it('finds a schema by its exact name', () => {
      const created = createSchema({ name: 'Car', fields: [] })

      expect(getSchemaByName('Car')?.id).toBe(created.id)
    })

    it('is case-insensitive', () => {
      const created = createSchema({ name: 'Car', fields: [] })

      expect(getSchemaByName('car')?.id).toBe(created.id)
      expect(getSchemaByName('CAR')?.id).toBe(created.id)
    })
  })

  describe('updateSchema', () => {
    it('adds, edits, and removes fields in a single update', () => {
      const created = createSchema({
        name: 'Car',
        fields: [
          { name: 'brand', type: 'text', required: true },
          { name: 'year', type: 'number', required: false }
        ]
      })
      const [brandField] = created.fields

      const updated = updateSchema(created.id, {
        name: 'Car',
        fields: [
          { id: brandField.id, name: 'brand', type: 'text', required: false },
          { name: 'owner', type: 'text', required: false }
        ]
      })

      expect(updated.fields.map((field) => field.name)).toEqual([
        'brand',
        'owner'
      ])
      expect(
        updated.fields.find((field) => field.name === 'brand')?.required
      ).toBe(false)
    })
  })
})
