import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://lauga3vi-server.onrender.com', // Tự động chuyển các request /api sang Render khi chạy ở máy tính (Local)
        changeOrigin: true,
        secure: false,
      },
    },
  },
})