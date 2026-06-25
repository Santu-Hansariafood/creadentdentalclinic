import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'sitemap.xml'],
        manifest: {
          name: 'Creadent Dental Clinic',
          short_name: 'Creadent',
          description: 'Creadent Dental Clinic Management System',
          theme_color: '#007FAF',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/favicon/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/favicon/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/favicon/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
        }
      })
    ],
    server: {
      port: 25000,
      allowedHosts: ['api.creadentsmiles.com'],
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:25001',
          changeOrigin: true,
        },
        '/graphql': {
          target: env.VITE_API_URL || 'http://localhost:25001',
          changeOrigin: true,
        },
        '/socket.io': {
          target: env.VITE_API_URL || 'http://localhost:25001',
          changeOrigin: true,
          ws: true,
        }
      }
    },
    preview: {
      allowedHosts: ['api.creadentsmiles.com']
    },
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
  }
})
