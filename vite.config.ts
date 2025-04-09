import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    port: 3001,
    proxy: {
      '/api/socketio': {
        target: 'http://localhost:3000',
        ws: true // Для WebSocket
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});