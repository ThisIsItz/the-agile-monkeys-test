import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Schema, SchemaPreviewResponse } from '@shared/types'
import { renderWithProviders } from '@/test/render'
import { SchemaChangePreviewModal } from './SchemaChangePreviewModal'
import * as entriesApi from '@/api/entries'

vi.mock('@/api/entries')

describe('SchemaChangePreviewModal', () => {
  it('renders an added_required change, which has no fieldId, without crashing', async () => {
    const schema: Schema = {
      id: 'schema-1',
      name: 'Article',
      fields: [
        {
          id: 'f-title',
          schemaId: 'schema-1',
          name: 'title',
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
    const preview: SchemaPreviewResponse = {
      changes: [
        {
          fieldName: 'featured',
          changeType: 'added_required',
          affectedEntryIds: ['entry-1']
        }
      ]
    }
    vi.mocked(entriesApi.getEntries).mockResolvedValue([
      {
        id: 'entry-1',
        schemaId: 'schema-1',
        data: { 'f-title': 'Hello World' },
        createdAt: '',
        updatedAt: ''
      }
    ])
    const user = userEvent.setup()

    renderWithProviders(
      <SchemaChangePreviewModal
        opened
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        preview={preview}
        schema={schema}
      />
    )

    expect(screen.getByText('featured')).toBeTruthy()
    expect(
      screen.getByText('Existing entries do not have a value for this field yet.')
    ).toBeTruthy()
    expect(screen.getByText('1 entry affected')).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: 'Show affected entries' })
    )

    expect(await screen.findByText('Hello World')).toBeTruthy()
  })
})
