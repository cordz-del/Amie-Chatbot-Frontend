import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Amie-Chatbot-Frontend/',
  plugins: [react()],
  root: '.',
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
    },
    extensions: ['.js', '.jsx'] // Add this line to handle both .js and .jsx files
  }
});
