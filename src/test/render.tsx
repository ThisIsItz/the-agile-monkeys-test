import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router-dom'

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', state }: { route?: string; state?: unknown } = {}
) {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={[{ pathname: route, state }]}>
        {ui}
      </MemoryRouter>
    </MantineProvider>
  )
}
