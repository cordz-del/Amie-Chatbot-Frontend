import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // If your GitHub repo is named "Amie-Chatbot-Frontend", 
  // this base is correct. Otherwise, adjust as needed.
  base: '/Amie-Chatbot-Frontend/',
  
  plugins: [react()],

  build: {
    // Change the output directory to "docs"
    // so GitHub Pages can serve it directly.
    outDir: 'docs',
  },
});
