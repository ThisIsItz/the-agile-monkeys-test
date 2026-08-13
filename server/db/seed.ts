import { createSchema } from '@server/schemas/schemas.repository.js'
import { createEntry } from '@server/entries/entries.repository.js'
import { getMetadata, setMetadata } from './metadata.repository.js'
import type { Schema } from '@shared/types.js'

const INITIAL_SEED_KEY = 'initial_seed_completed'

function fieldId(schema: Schema, name: string): string {
  const field = schema.fields.find((f) => f.name === name)
  if (!field) {
    throw new Error(`Field "${name}" not found on schema "${schema.name}"`)
  }
  return field.id
}

export function seedInitialData(): void {
  if (getMetadata(INITIAL_SEED_KEY) === 'true') {
    return
  }

  const authorSchema = createSchema({
    name: 'Author',
    fields: [
      {
        name: 'name',
        type: 'text',
        required: true
      },
      {
        name: 'birthYear',
        type: 'number',
        required: false
      }
    ]
  })

  const bookSchema = createSchema({
    name: 'Book',
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true
      },
      {
        name: 'year',
        type: 'text',
        required: false
      },
      {
        name: 'published',
        type: 'boolean',
        required: false
      },
      {
        name: 'author',
        type: 'reference',
        required: false,
        referenceTargetSchemaId: authorSchema.id
      }
    ]
  })

  const authorName = fieldId(authorSchema, 'name')
  const authorBirthYear = fieldId(authorSchema, 'birthYear')

  const austen = createEntry(authorSchema.id, {
    data: { [authorName]: 'Jane Austen', [authorBirthYear]: 1775 }
  })
  const orwell = createEntry(authorSchema.id, {
    data: { [authorName]: 'George Orwell', [authorBirthYear]: 1903 }
  })
  const morrison = createEntry(authorSchema.id, {
    data: { [authorName]: 'Toni Morrison', [authorBirthYear]: 1931 }
  })

  const bookTitle = fieldId(bookSchema, 'title')
  const bookYear = fieldId(bookSchema, 'year')
  const bookPublished = fieldId(bookSchema, 'published')
  const bookAuthor = fieldId(bookSchema, 'author')

  const books = [
    { title: 'Pride and Prejudice', year: '1813', authorId: austen.id },
    { title: '1984', year: '1949', authorId: orwell.id },
    { title: 'Animal Farm', year: '1945', authorId: orwell.id },
    { title: 'Beloved', year: '1987', authorId: morrison.id }
  ]

  for (const book of books) {
    createEntry(bookSchema.id, {
      data: {
        [bookTitle]: book.title,
        [bookYear]: book.year,
        [bookPublished]: true,
        [bookAuthor]: book.authorId
      }
    })
  }

  setMetadata(INITIAL_SEED_KEY, 'true')
}
