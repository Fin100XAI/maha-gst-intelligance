import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // The API port is configurable because a crashed uvicorn can leave a
    // socket stuck on Windows, and a developer should not have to edit a
    // committed file to work around it. `VITE_API_PORT=8001 npm run dev`.
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.VITE_API_PORT ?? '8000'}`,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
