import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Avoid CORS in development: the browser calls /api and Vite forwards it.
    proxy: {
      '/api': {
        target: process.env.VITE_API_SERVER || 'http://localhost:8080/ExServ',
        changeOrigin: true,
      },
    },
  },
})
