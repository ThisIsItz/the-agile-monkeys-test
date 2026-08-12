import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/test/render'
import { SchemaEditorPage } from './SchemaEditorPage'
import * as schemasApi from '@/api/schemas'

vi.mock('@/api/schemas')

describe('SchemaEditorPage', () => {
  it('fetches the schema by route id and renders the editor pre-filled', async () => {
    vi.mocked(schemasApi.getSchema).mockResolvedValue({
      id: 'car-1',
      name: 'Car',
      fields: [
        {
          id: 'f1',
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
    })
    vi.mocked(schemasApi.getSchemas).mockResolvedValue([])

    renderWithProviders(
      <Routes>
        <Route path="/schemas/:id/edit" element={<SchemaEditorPage />} />
      </Routes>,
      { route: '/schemas/car-1/edit' }
    )

    expect(await screen.findByDisplayValue('Car')).toBeTruthy()
    expect(schemasApi.getSchema).toHaveBeenCalledWith('car-1')
    expect(screen.getByDisplayValue('brand')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Edit Schema' })).toBeTruthy()
  })
})
