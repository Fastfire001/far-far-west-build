import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site under /<repo>/, not at the domain root.
  base: command === 'build' ? '/far-far-west-build/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('../data', import.meta.url)),
    },
  },
  server: {
    // The app reads data/ and assets/ from outside web/.
    fs: { allow: ['..'] },
  },
  build: {
    // Keep each icon as its own file instead of inlining all 222 of them into the JS bundle.
    assetsInlineLimit: 0,
  },
}))
