import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    cors: true,
    watch: {
      usePolling: true, // Используем polling вместо file system events в Docker
    },
    hmr: false, // Отключаем HMR для работы через Kong
    // Прокси не нужен, т.к. API идет через Kong
  },
})
