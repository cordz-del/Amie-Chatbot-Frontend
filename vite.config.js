import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Amie-Chatbot-Frontend/',
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'docs', // Using 'docs' for GitHub Pages compatibility
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
