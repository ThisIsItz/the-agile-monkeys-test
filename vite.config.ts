import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    env: {
      DB_PATH: ':memory:'
    }
  }
})
