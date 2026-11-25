import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// SSR build of the MCP handler into a self-contained module for the Netlify function.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  ssr: { noExternal: true },
  build: {
    ssr: 'src/mcp/handler.ts',
    outDir: 'dist-mcp',
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'handler.mjs', format: 'es' } },
  },
})
