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
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/apiurl/, ''),
      },
      '/geoserver': {
        target: 'http://geoserver:8080/geoserver',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
