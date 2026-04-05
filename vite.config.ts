import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@quantum': path.resolve(__dirname, './src/quantum'),
      '@graphics': path.resolve(__dirname, './src/graphics'),
      '@electronics': path.resolve(__dirname, './src/electronics'),
      '@math': path.resolve(__dirname, './src/math'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    hmr: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  worker: {
    format: 'es',
  },
})
