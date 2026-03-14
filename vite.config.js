import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const removeCrossoriginPlugin = () => {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/crossorigin/g, '');
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    removeCrossoriginPlugin(),
  ],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
})
