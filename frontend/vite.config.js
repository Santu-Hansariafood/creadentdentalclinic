import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('recharts') || id.includes('react-hot-toast')) {
              return 'vendor-ui';
            }
            if (id.includes('@apollo/client') || id.includes('graphql')) {
              return 'vendor-graphql';
            }
            if (id.includes('jspdf') || id.includes('stripe') || id.includes('axios') || id.includes('socket.io-client')) {
              return 'vendor-utils';
            }
            if (id.includes('react-icons') || id.includes('bootstrap') || id.includes('react-countup')) {
              return 'vendor-libs';
            }
            return 'vendor-misc';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
