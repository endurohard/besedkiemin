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
    allowedHosts: ['it005.ru', 'localhost', '127.0.0.1', '192.168.5.43'],
    watch: {
      usePolling: true, // Используем polling вместо file system events в Docker
    },
    hmr: false, // Отключаем HMR для работы через Kong
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
