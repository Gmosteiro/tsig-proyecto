import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/apiurl': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/geoserver': {
        target: 'http://localhost:8080/geoserver',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
