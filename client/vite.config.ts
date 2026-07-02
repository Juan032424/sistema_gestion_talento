import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor_mui';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor_charts';
            }
            if (id.includes('framer-motion') || id.includes('gsap')) {
              return 'vendor_animations';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
