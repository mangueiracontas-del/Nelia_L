import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' garante funcionamento no GitHub Pages (subdiretório do usuário)
export default defineConfig({
  plugins: [react()],
  base: './',
})
