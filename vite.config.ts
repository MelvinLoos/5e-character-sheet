import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
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
})
