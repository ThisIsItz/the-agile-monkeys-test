import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import App from './App'
import * as schemasApi from '@/api/schemas'

vi.mock('@/api/schemas')

describe('App routing', () => {
  it('redirects / to /schemas', async () => {
    vi.mocked(schemasApi.getSchemas).mockResolvedValue([])

    renderWithProviders(<App />, { route: '/' })

    expect(await screen.findByRole('heading', { name: 'Schemas' })).toBeTruthy()
  })

  it('renders the editor, not the list, for /schemas/:id/edit', async () => {
    vi.mocked(schemasApi.getSchema).mockResolvedValue({
      id: 'car-1',
      name: 'Car',
      fields: [
        {
          id: 'field-1',
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

    renderWithProviders(<App />, { route: '/schemas/car-1/edit' })

    expect(
      await screen.findByRole('heading', { name: 'Edit Schema' })
    ).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Schemas' })).toBeNull()
  })
})
