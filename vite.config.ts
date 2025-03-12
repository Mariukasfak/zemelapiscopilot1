import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Pašalinkite arba užkomentuokite šią eilutę, nes Netlify tvarko bazinį kelią
  // base: '/lithuania-interactive-map/',
})
