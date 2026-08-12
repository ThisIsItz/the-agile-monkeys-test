import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import type { Entry, Schema } from '@shared/types'
import { renderWithProviders } from '@/test/render'
import { EntriesPage } from './EntriesPage'
import * as entriesApi from '@/api/entries'
import * as schemasApi from '@/api/schemas'
import { modals } from '@mantine/modals'

vi.mock('@/api/entries')
vi.mock('@/api/schemas')
vi.mock('@mantine/modals', () => ({
  modals: { openConfirmModal: vi.fn() }
}))

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

const carSchema: Schema = {
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

const personEntry: Entry = {
  id: 'person-entry-1',
  schemaId: 'person-1',
  data: { 'p-name': 'Alice' },
  createdAt: '',
  updatedAt: ''
}

const carEntry: Entry = {
  id: 'car-entry-1',
  schemaId: 'car-1',
  data: { 'c-owner': 'person-entry-1' },
  createdAt: '',
  updatedAt: ''
}

function renderEntriesPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/schemas/:schemaId/entries" element={<EntriesPage />} />
    </Routes>,
    { route: '/schemas/car-1/entries' }
  )
}

describe('EntriesPage', () => {
  it('renders fetched entries with reference values resolved to a clickable label', async () => {
    vi.mocked(schemasApi.getSchema).mockImplementation(async (id) =>
      id === 'car-1' ? carSchema : personSchema
    )
    vi.mocked(entriesApi.getEntries).mockImplementation(async (schemaId) =>
      schemaId === 'car-1' ? [carEntry] : [personEntry]
    )

    renderEntriesPage()

    const link = await screen.findByRole('link', { name: 'Alice' })
    expect(link.getAttribute('href')).toBe(
      '/schemas/person-1/entries/person-entry-1/edit'
    )
  })

  it('deletes an entry after confirming and refreshes the list', async () => {
    vi.mocked(schemasApi.getSchema).mockImplementation(async (id) =>
      id === 'car-1' ? carSchema : personSchema
    )
    vi.mocked(entriesApi.getEntries).mockImplementation(async (schemaId) =>
      schemaId === 'car-1' ? [carEntry] : [personEntry]
    )
    vi.mocked(entriesApi.deleteEntry).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderEntriesPage()

    await screen.findByRole('link', { name: 'Alice' })
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(modals.openConfirmModal).toHaveBeenCalledTimes(1)
    const { onConfirm } = vi.mocked(modals.openConfirmModal).mock.calls[0][0] as {
      onConfirm: () => void
    }

    vi.mocked(entriesApi.getEntries).mockImplementation(async (schemaId) =>
      schemaId === 'car-1' ? [] : [personEntry]
    )
    onConfirm()

    await waitFor(() =>
      expect(entriesApi.deleteEntry).toHaveBeenCalledWith(
        'car-1',
        'car-entry-1'
      )
    )
    await waitFor(() =>
      expect(screen.getByText('No entries yet.')).toBeTruthy()
    )
  })
})
