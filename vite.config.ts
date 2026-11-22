import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `npm run dev:api` in a second terminal serves the API on 8787.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
})
