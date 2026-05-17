import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/optcg/',
  server: {
    proxy: {
      '/optcg-api': {
        target: 'https://optcgapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/optcg-api/, ''),
      },
      '/tcg-price-api': {
        target: 'https://api.tcgpricelookup.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tcg-price-api/, ''),
      },
    },
  },
})
