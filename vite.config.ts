import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Netlify's Supabase integration might inject SUPABASE_URL or SUPABASE_DATABASE_URL
  // We need to ensure we use a valid HTTP URL for the Supabase client
  let supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''
  if (!supabaseUrl && env.SUPABASE_DATABASE_URL && env.SUPABASE_DATABASE_URL.startsWith('http')) {
    supabaseUrl = env.SUPABASE_DATABASE_URL
  }

  return {
    plugins: [
    vue(),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      deep: true,
      dts: 'src/components.d.ts',
    }),
    vueJsx(),
    ...(mode === 'development' ? [vueDevTools()] : []),
    VitePWA({
      registerType: 'prompt',
      manifest: false,
      injectRegister: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '')
  },
  build: {
    // Encourage Rollup to split large vendor chunks into smaller pieces
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('node_modules/vue')) return 'vendor_vue'
            if (id.includes('node_modules/pinia')) return 'vendor_state'
            if (id.includes('node_modules/@supabase') || id.includes('@supabase')) return 'vendor_supabase'
            if (id.includes('node_modules/feather-icons')) return 'vendor_icons'
            if (id.includes('node_modules/vuedraggable')) return 'vendor_draggable'
            // Removing manual ajv chunk to avoid breaking CommonJS wrapper boundary
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  }
})