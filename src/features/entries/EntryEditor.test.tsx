import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Entry, Schema } from '@shared/types'
import { renderWithProviders } from '@/test/render'
import { EntryEditor } from './EntryEditor'
import * as entriesApi from '@/api/entries'
import * as schemasApi from '@/api/schemas'

vi.mock('@/api/entries')
vi.mock('@/api/schemas')

const carSchemaTextOnly: Schema = {
  id: 'car-1',
  name: 'Car',
  fields: [
    {
      id: 'c-brand',
      schemaId: 'car-1',
      name: 'brand',
      type: 'text',
      required: true,
      referenceTargetSchemaId: null,
      position: 0,
      createdAt: '',
      updatedAt: ''
    }
  ],
  createdAt: '',
  updatedAt: ''
}

describe('EntryEditor', () => {
  it('submits a new entry with data keyed by field id', async () => {
    vi.mocked(entriesApi.createEntry).mockResolvedValue({
      id: 'new-entry',
      schemaId: 'car-1',
      data: { 'c-brand': 'Tesla' },
      createdAt: '',
      updatedAt: ''
    })
    const handleBack = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(
      <EntryEditor schema={carSchemaTextOnly} handleBack={handleBack} />
    )

    await user.type(screen.getByLabelText(/^brand/), 'Tesla')
    await user.click(screen.getByRole('button', { name: 'Create entry' }))

    await waitFor(() =>
      expect(entriesApi.createEntry).toHaveBeenCalledWith('car-1', {
        data: { 'c-brand': 'Tesla' }
      })
    )
    await waitFor(() => expect(handleBack).toHaveBeenCalled())
  })

  it('pre-fills form values from entry.data keyed by field id when editing', async () => {
    const existingEntry: Entry = {
      id: 'car-entry-1',
      schemaId: 'car-1',
      data: { 'c-brand': 'Tesla' },
      createdAt: '',
      updatedAt: ''
    }

    renderWithProviders(
      <EntryEditor
        schema={carSchemaTextOnly}
        entry={existingEntry}
        handleBack={vi.fn()}
      />
    )

    expect(await screen.findByDisplayValue('Tesla')).toBeTruthy()
  })

  it('populates the reference field select with labeled options from the target schema entries', async () => {
    const carSchemaWithReference: Schema = {
      id: 'car-1',
      name: 'Car',
      fields: [
        {
          id: 'c-owner',
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
      fields: [
        {
          id: 'p-name',
          schemaId: 'person-1',
          name: 'name',
          type: 'text',
          required: true,
          referenceTargetSchemaId: null,
          position: 0,
          createdAt: '',
          updatedAt: ''
        }
      ],
      createdAt: '',
      updatedAt: ''
    }
    const personEntry: Entry = {
      id: 'person-entry-1',
      schemaId: 'person-1',
      data: { 'p-name': 'Alice' },
      createdAt: '',
      updatedAt: ''
    }

    vi.mocked(schemasApi.getSchema).mockResolvedValue(personSchema)
    vi.mocked(entriesApi.getEntries).mockResolvedValue([personEntry])

    const user = userEvent.setup()
    renderWithProviders(
      <EntryEditor schema={carSchemaWithReference} handleBack={vi.fn()} />
    )

    const referenceSelect = await screen.findByRole('combobox', {
      name: /owner/
    })
    await user.click(referenceSelect)

    expect(await screen.findByText('Alice')).toBeTruthy()
  })
})
