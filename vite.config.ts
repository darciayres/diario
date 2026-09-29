/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Simula um navegador para testar componentes React.
    environment: 'jsdom',
    // Roda antes de cada arquivo de teste.
    setupFiles: ['./src/test/setup.ts'],
  },
})
