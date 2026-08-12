import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router-dom'

export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {}
) {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </MantineProvider>
  )
}
