import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public', 
  server: {
    port: 3001, 
    proxy: {
      '/api': {
        target: 'http://localhost:3000', 
        changeOrigin: true,
        rewrite: (path) => path 
      }
    }
  },
  build: {
    outDir: '../dist', 
    emptyOutDir: true
  }
});