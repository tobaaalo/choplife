import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'shared/**/*.test.ts',
      'src/**/*.test.{ts,tsx}',
      'server/**/*.test.ts',
      'workers/**/*.test.ts',
    ],
    environment: 'node',
  },
})
