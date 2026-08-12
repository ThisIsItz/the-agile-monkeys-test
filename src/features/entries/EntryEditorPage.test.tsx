import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import type { Schema } from '@shared/types'
import { renderWithProviders } from '@/test/render'
import { EntryEditorPage } from './EntryEditorPage'
import * as entriesApi from '@/api/entries'
import * as schemasApi from '@/api/schemas'

vi.mock('@/api/entries')
vi.mock('@/api/schemas')

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
})
