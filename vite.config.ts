import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fullReload from 'vite-plugin-full-reload'

export default defineConfig({
  plugins: [
    react(),
    fullReload(['src/**', 'index.html'], { delay: 100 })
  ],
  server: {
    port: 3000,
    strictPort: true,
    host: true
  }
})



