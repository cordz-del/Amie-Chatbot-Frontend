import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Amie-Chatbot-Frontend/',
  plugins: [react()],
  build: {
    outDir: 'docs',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
