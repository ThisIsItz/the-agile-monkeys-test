import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from './db.js'
import { getMetadata } from './metadata.repository.js'
import { getSchemaByName, listSchemas } from '@server/schemas/schemas.repository.js'
import { listEntries } from '@server/entries/entries.repository.js'

let failOnCall: number | null = null
let callCount = 0

vi.mock('@server/entries/entries.repository.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@server/entries/entries.repository.js')>()

  return {
    ...actual,
    createEntry: (...args: Parameters<typeof actual.createEntry>) => {
      callCount += 1
      if (failOnCall !== null && callCount === failOnCall) {
        throw new Error('Simulated failure for testing rollback')
      }
      return actual.createEntry(...args)
    }
  }
})

const { seedInitialData } = await import('./seed.js')

describe('seedInitialData', () => {
  beforeEach(() => {
    db.exec(
      'DELETE FROM entries; DELETE FROM fields; DELETE FROM schemas; DELETE FROM app_metadata;'
    )
    failOnCall = null
    callCount = 0
  })

  it('creates the Author and Book schemas, with Book referencing Author', () => {
    seedInitialData()

    const authorSchema = getSchemaByName('Author')
    const bookSchema = getSchemaByName('Book')

    expect(authorSchema).toBeTruthy()
    expect(bookSchema).toBeTruthy()

    const authorField = bookSchema!.fields.find((f) => f.name === 'author')
    expect(authorField?.referenceTargetSchemaId).toBe(authorSchema!.id)
  })

  it('is idempotent: calling it twice does not duplicate schemas or entries', () => {
    seedInitialData()

    const schemaCountAfterFirst = listSchemas().length
    const authorSchema = getSchemaByName('Author')!
    const bookSchema = getSchemaByName('Book')!
    const authorEntriesAfterFirst = listEntries(authorSchema.id).length
    const bookEntriesAfterFirst = listEntries(bookSchema.id).length

    seedInitialData()

    expect(listSchemas()).toHaveLength(schemaCountAfterFirst)
    expect(listEntries(authorSchema.id)).toHaveLength(authorEntriesAfterFirst)
    expect(listEntries(bookSchema.id)).toHaveLength(bookEntriesAfterFirst)
  })

  it('rolls back all data if a failure occurs partway through', () => {
    failOnCall = 7 // the last of the 7 createEntry calls (3 authors + 4 books)

    expect(() => seedInitialData()).toThrow('Simulated failure for testing rollback')

    expect(listSchemas()).toHaveLength(0)
    expect(getMetadata('initial_seed_completed')).toBeUndefined()
  })
})
