import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Schema } from '@shared/types'
import { renderWithProviders } from '@/test/render'
import { SchemaList } from './SchemasPage'
import * as schemasApi from '@/api/schemas'
import { socket } from '@/realtime/socket'

vi.mock('@/api/schemas')
vi.mock('@/realtime/socket', () => ({
  socket: { on: vi.fn(), off: vi.fn() }
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
    vi.mocked(socket.on).mockClear()
    vi.mocked(socket.off).mockClear()
  })

  it('renders fetched schemas with fields and resolved reference target names', async () => {
    renderWithProviders(<SchemaList />)

    expect(await screen.findByText('Person')).toBeTruthy()
    expect(screen.getByText('Car')).toBeTruthy()
    expect(screen.getByText('name')).toBeTruthy()
    expect(screen.getByText('→ Person')).toBeTruthy()
  })

  it('previews the deletion impact, then deletes the schema after confirming and refreshes the list', async () => {
    vi.mocked(schemasApi.previewSchemaDeletion).mockResolvedValue({
      schemaId: 'person-1',
      affectedEntryIds: [],
      blockingReferences: []
    })
    vi.mocked(schemasApi.deleteSchema).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderWithProviders(<SchemaList />)

    await screen.findByText('Person')
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])

    expect(schemasApi.previewSchemaDeletion).toHaveBeenCalledWith('person-1')
    expect(await screen.findByText('This schema has no entries.')).toBeTruthy()

    vi.mocked(schemasApi.getSchemas).mockResolvedValue([carSchema])
    await user.click(screen.getByRole('button', { name: 'Delete schema' }))

    await waitFor(() =>
      expect(schemasApi.deleteSchema).toHaveBeenCalledWith('person-1')
    )
    await waitFor(() => expect(screen.queryByText('Person')).toBeNull())
  })

  it('disables the delete confirmation when another schema still references it', async () => {
    vi.mocked(schemasApi.previewSchemaDeletion).mockResolvedValue({
      schemaId: 'person-1',
      affectedEntryIds: [],
      blockingReferences: [
        {
          schemaId: 'car-1',
          schemaName: 'Car',
          fieldId: 'f2',
          fieldName: 'owner'
        }
      ]
    })
    const user = userEvent.setup()

    renderWithProviders(<SchemaList />)

    await screen.findByText('Person')
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])

    const confirmButton = await screen.findByRole('button', {
      name: 'Delete schema'
    })
    expect(confirmButton).toBeDisabled()
    expect(schemasApi.deleteSchema).not.toHaveBeenCalled()
  })

  it('refetches the list when a schemas:changed event is received', async () => {
    vi.mocked(schemasApi.getSchemas).mockResolvedValue([personSchema])
    renderWithProviders(<SchemaList />)

    await screen.findByText('Person')
    expect(screen.queryByText('Car')).toBeNull()

    vi.mocked(schemasApi.getSchemas).mockResolvedValue([personSchema, carSchema])
    const listener = vi
      .mocked(socket.on)
      .mock.calls.find(([event]) => event === 'schemas:changed')?.[1] as
      | (() => void)
      | undefined
    listener?.()

    expect(await screen.findByText('Car')).toBeTruthy()
  })
})
