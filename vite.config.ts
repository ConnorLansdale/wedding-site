import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Base path for GitHub Pages deployment
  // Change this if using custom domain (set to '/')
  base: '/wedding-site/',

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
