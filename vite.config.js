import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Ne-laiko/',
  plugins: [react()],
  server: {
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_API_SERVER || 'http://localhost:8080/ExServ',
          changeOrigin: true,
        },
        '/ws': {
          target: process.env.VITE_API_SERVER || 'http://localhost:8080/ExServ',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  },
})
