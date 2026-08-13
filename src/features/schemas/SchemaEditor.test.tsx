import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Schema } from '@shared/types'
import { renderWithProviders } from '@/test/render'
import { SchemaEditor } from './SchemaEditor'
import * as schemasApi from '@/api/schemas'
import * as entriesApi from '@/api/entries'

vi.mock('@/api/schemas')
vi.mock('@/api/entries')

describe('SchemaEditor', () => {
  beforeEach(() => {
    vi.mocked(schemasApi.getSchemas).mockResolvedValue([])
  })

  it('submits a new schema and navigates back', async () => {
    vi.mocked(schemasApi.createSchema).mockResolvedValue({
      id: 'new-id',
      name: 'Car',
      fields: [],
      createdAt: '',
      updatedAt: ''
    })
    const handleBack = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(<SchemaEditor handleBack={handleBack} />)

    await user.type(screen.getByLabelText(/Schema Name/), 'Car')
    await user.type(screen.getByLabelText(/^Name/), 'brand')
    await user.click(screen.getByRole('button', { name: 'Create schema' }))

    await waitFor(() =>
      expect(schemasApi.createSchema).toHaveBeenCalledWith({
        name: 'Car',
        fields: [{ name: 'brand', type: 'text', required: false }]
      })
    )
    await waitFor(() => expect(handleBack).toHaveBeenCalled())
  })

  it('disables removing the last remaining field', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemaEditor handleBack={vi.fn()} />)

    const getRemoveButtons = () =>
      screen.getAllByRole('button', {
        name: 'Remove field'
      }) as HTMLButtonElement[]

    expect(getRemoveButtons()[0].disabled).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Add field' }))
    expect(getRemoveButtons()[0].disabled).toBe(false)

    await user.click(getRemoveButtons()[0])
    expect(getRemoveButtons()[0].disabled).toBe(true)
  })

  it('excludes the schema being edited from its own reference target options', async () => {
    const editedSchema: Schema = {
      id: 'car-1',
      name: 'Car',
      fields: [
        {
          id: 'f1',
          schemaId: 'car-1',
          name: 'owner',
          type: 'reference',
          required: true,
          referenceTargetSchemaId: 'person-1',
          position: 0,
          createdAt: '',
          updatedAt: ''
        }
      ],
      createdAt: '',
      updatedAt: ''
    }
    const personSchema: Schema = {
      id: 'person-1',
      name: 'Person',
      fields: [],
      createdAt: '',
      updatedAt: ''
    }
    vi.mocked(schemasApi.getSchemas).mockResolvedValue([editedSchema, personSchema])

    const user = userEvent.setup()
    renderWithProviders(<SchemaEditor schema={editedSchema} handleBack={vi.fn()} />)

    const referenceSelect = await screen.findByRole('combobox', {
      name: /Reference/
    })
    await user.click(referenceSelect)

    expect(await screen.findByText('Person')).toBeTruthy()
    expect(screen.queryByText('Car')).toBeNull()
  })

  it('shows the change preview before applying, and only updates after confirming', async () => {
    const editedSchema: Schema = {
      id: 'book-1',
      name: 'Book',
      fields: [
        {
          id: 'f1',
          schemaId: 'book-1',
          name: 'subtitle',
          type: 'text',
          required: false,
          referenceTargetSchemaId: null,
          position: 0,
          createdAt: '',
          updatedAt: ''
        }
      ],
      createdAt: '',
      updatedAt: ''
    }
    vi.mocked(schemasApi.getSchemas).mockResolvedValue([editedSchema])
    vi.mocked(schemasApi.previewSchemaChange).mockResolvedValue({
      changes: [
        {
          fieldId: 'f1',
          fieldName: 'subtitle',
          changeType: 'made_required',
          affectedEntryIds: ['entry-1']
        }
      ]
    })
    vi.mocked(entriesApi.getEntries).mockResolvedValue([])
    vi.mocked(schemasApi.updateSchema).mockResolvedValue(editedSchema)
    const handleBack = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(
      <SchemaEditor schema={editedSchema} handleBack={handleBack} />
    )

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Review schema changes')).toBeTruthy()
    expect(schemasApi.updateSchema).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Apply changes' }))

    await waitFor(() =>
      expect(schemasApi.updateSchema).toHaveBeenCalledWith('book-1', {
        name: 'Book',
        fields: [
          {
            id: 'f1',
            name: 'subtitle',
            type: 'text',
            required: false,
            referenceTargetSchemaId: null
          }
        ]
      })
    )
    await waitFor(() => expect(handleBack).toHaveBeenCalled())
  })
})
