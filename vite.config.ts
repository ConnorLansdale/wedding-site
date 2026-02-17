import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Base path for GitHub Pages deployment
  // For repo: https://username.github.io/wedding-site/
  base: process.env.NODE_ENV === 'production' ? '/wedding-site/' : '/',

  build: {
    // Output directory
    outDir: 'dist',

    // Generate source maps for debugging
    sourcemap: true,

    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
