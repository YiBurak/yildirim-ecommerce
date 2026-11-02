import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5041',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5041',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
