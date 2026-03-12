import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Starving Student Card',
        short_name: 'SSC Map',
        description: 'Find Starving Student Card deals near you in Utah County',
        theme_color: '#0170B9',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache all built assets (JS bundles include deals.json since it's a static import)
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
        cleanupOutdatedCaches: true,
        // Navigate fallback: serve cached index.html for all navigation when offline
        navigateFallback: '/index.html',
        // Don't apply navigateFallback to OSM tile requests
        navigateFallbackDenylist: [/^\/api/, /tile\.openstreetmap\.org/],
        runtimeCaching: [
          // Google Fonts CSS — CacheFirst, 1 year
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts files — CacheFirst, 1 year
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // OSM tiles — explicitly excluded: too large, would exhaust storage quota.
          // Map shows gray tiles offline; all app functionality still works.
        ],
      },
    }),
  ],
})
