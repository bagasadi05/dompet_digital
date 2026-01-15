import path from 'path';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      basicSsl(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/*.png', 'fonts/*.woff2'],
        manifest: {
          name: 'Dompet Digital',
          short_name: 'Dompet',
          description: 'Aplikasi Manajemen Keuangan Pribadi dengan AI',
          theme_color: '#10B981',
          background_color: '#0A0F1A',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          categories: ['finance', 'productivity'],
          shortcuts: [
            {
              name: 'Tambah Transaksi',
              short_name: 'Transaksi',
              description: 'Catat transaksi baru',
              url: '/transactions?action=add',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
            },
            {
              name: 'AI Chat',
              short_name: 'AI',
              description: 'Chat dengan asisten AI',
              url: '/ai-chat',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                },
                networkTimeoutSeconds: 10
              }
            }
          ]
        },
        devOptions: {
          enabled: true
        }
      })
    ],
    define: {
      // OpenRouter removed as requested
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    }
  };
});
