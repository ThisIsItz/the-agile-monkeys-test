import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Schema } from '@shared/types'
import { renderWithProviders } from '@/test/render'
import { SchemaList } from './SchemasPage'
import * as schemasApi from '@/api/schemas'
import { modals } from '@mantine/modals'

vi.mock('@/api/schemas')
vi.mock('@mantine/modals', () => ({
  modals: { openConfirmModal: vi.fn() }
}))

const personSchema: Schema = {
  id: 'person-1',
  name: 'Person',
  fields: [
    {
      id: 'f1',
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

const carSchema: Schema = {
  id: 'car-1',
  name: 'Car',
  fields: [
    {
      id: 'f2',
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

describe('SchemaList', () => {
  beforeEach(() => {
    vi.mocked(schemasApi.getSchemas).mockResolvedValue([personSchema, carSchema])
  })

  it('renders fetched schemas with fields and resolved reference target names', async () => {
    renderWithProviders(<SchemaList />)

    expect(await screen.findByText('Person')).toBeTruthy()
    expect(screen.getByText('Car')).toBeTruthy()
    expect(screen.getByText('name')).toBeTruthy()
    expect(screen.getByText('→ Person')).toBeTruthy()
  })

  it('deletes a schema after confirming and refreshes the list', async () => {
    vi.mocked(schemasApi.deleteSchema).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderWithProviders(<SchemaList />)

    await screen.findByText('Person')
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])

    expect(modals.openConfirmModal).toHaveBeenCalledTimes(1)
    const { onConfirm } = vi.mocked(modals.openConfirmModal).mock.calls[0][0] as {
      onConfirm: () => void
    }

    vi.mocked(schemasApi.getSchemas).mockResolvedValue([carSchema])
    onConfirm()

    await waitFor(() =>
      expect(schemasApi.deleteSchema).toHaveBeenCalledWith('person-1')
    )
    await waitFor(() => expect(screen.queryByText('Person')).toBeNull())
  })
})
