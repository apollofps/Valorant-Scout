import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: repo name as base path (e.g. /valorant-scout/)
// Set VITE_BASE_PATH in GitHub Actions or .env; leave unset for local / Vercel
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
