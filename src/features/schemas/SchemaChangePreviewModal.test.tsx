import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SchemaPreviewResponse } from '@shared/types'
import { renderWithProviders } from '@/test/render'
import { SchemaChangePreviewModal } from './SchemaChangePreviewModal'

describe('SchemaChangePreviewModal', () => {
  it('renders an added_required change, which has no fieldId, without crashing', async () => {
    const preview: SchemaPreviewResponse = {
      changes: [
        {
          fieldName: 'featured',
          changeType: 'added_required',
          affectedEntries: [{ id: 'entry-1', label: 'Hello World' }]
        }
      ]
    }
    const user = userEvent.setup()

    renderWithProviders(
      <SchemaChangePreviewModal
        opened
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        preview={preview}
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
