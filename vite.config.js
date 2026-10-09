import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Source maps are a development aid; do not ship them in production.
    sourcemap: false,
  },
})
