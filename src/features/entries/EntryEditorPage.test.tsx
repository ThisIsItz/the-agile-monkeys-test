import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import type { Schema } from '@shared/types'
import { renderWithProviders } from '@/test/render'
import { EntryEditorPage } from './EntryEditorPage'
import * as entriesApi from '@/api/entries'
import * as schemasApi from '@/api/schemas'
import { socket } from '@/realtime/socket'

vi.mock('@/api/entries')
vi.mock('@/api/schemas')
vi.mock('@/realtime/socket', () => ({
  socket: { on: vi.fn(), off: vi.fn() }
}))

function findListener(event: string) {
  return vi.mocked(socket.on).mock.calls.find(([e]) => e === event)?.[1] as
    | ((payload: { schemaId: string; entryId?: string }) => void)
    | undefined
}

const carSchema: Schema = {
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

describe('EntryEditorPage', () => {
  beforeEach(() => {
    vi.mocked(socket.on).mockClear()
    vi.mocked(socket.off).mockClear()
  })

  it('fetches the schema and entry by route params and renders the editor pre-filled', async () => {
    vi.mocked(schemasApi.getSchema).mockResolvedValue(carSchema)
    vi.mocked(entriesApi.getEntry).mockResolvedValue({
      id: 'car-entry-1',
      schemaId: 'car-1',
      data: { 'c-brand': 'Tesla' },
      createdAt: '',
      updatedAt: ''
    })
    vi.mocked(entriesApi.getEntries).mockResolvedValue([])

    renderWithProviders(
      <Routes>
        <Route
          path="/schemas/:schemaId/entries/:entryId/edit"
          element={<EntryEditorPage />}
        />
      </Routes>,
      { route: '/schemas/car-1/entries/car-entry-1/edit' }
    )

    expect(await screen.findByDisplayValue('Tesla')).toBeTruthy()
    expect(schemasApi.getSchema).toHaveBeenCalledWith('car-1')
    expect(entriesApi.getEntry).toHaveBeenCalledWith('car-1', 'car-entry-1')
    expect(screen.getByRole('heading', { name: 'Edit Entry' })).toBeTruthy()
  })

  it('shows the schema-changed and entry-changed warnings only for matching ids', async () => {
    vi.mocked(schemasApi.getSchema).mockResolvedValue(carSchema)
    vi.mocked(entriesApi.getEntry).mockResolvedValue({
      id: 'car-entry-1',
      schemaId: 'car-1',
      data: { 'c-brand': 'Tesla' },
      createdAt: '',
      updatedAt: ''
    })
    vi.mocked(entriesApi.getEntries).mockResolvedValue([])

    renderWithProviders(
      <Routes>
        <Route
          path="/schemas/:schemaId/entries/:entryId/edit"
          element={<EntryEditorPage />}
        />
      </Routes>,
      { route: '/schemas/car-1/entries/car-entry-1/edit' }
    )
    await screen.findByDisplayValue('Tesla')

    const schemasListener = findListener('schemas:changed')
    const entriesListener = findListener('entries:changed')

    schemasListener?.({ schemaId: 'other-schema' })
    entriesListener?.({ schemaId: 'car-1', entryId: 'other-entry' })
    expect(screen.queryByText('This schema was changed')).toBeNull()
    expect(screen.queryByText('This entry was changed')).toBeNull()

    schemasListener?.({ schemaId: 'car-1' })
    await waitFor(() =>
      expect(screen.getByText('This schema was changed')).toBeTruthy()
    )

    entriesListener?.({ schemaId: 'car-1', entryId: 'car-entry-1' })
    await waitFor(() =>
      expect(screen.getByText('This entry was changed')).toBeTruthy()
    )
  })

  it('never shows the entry-changed warning on the create route (no entryId)', async () => {
    vi.mocked(schemasApi.getSchema).mockResolvedValue(carSchema)
    vi.mocked(entriesApi.getEntries).mockResolvedValue([])

    renderWithProviders(
      <Routes>
        <Route path="/schemas/:schemaId/entries/new" element={<EntryEditorPage />} />
      </Routes>,
      { route: '/schemas/car-1/entries/new' }
    )
    await screen.findByRole('heading', { name: 'Create Entry' })

    const entriesListener = findListener('entries:changed')
    entriesListener?.({ schemaId: 'car-1', entryId: 'anything' })

    expect(screen.queryByText('This entry was changed')).toBeNull()
  })
})
