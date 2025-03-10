import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public', // Указываем корень клиентской части
  server: {
    port: 3001, // Порт для клиента
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Проксируем API на сервер
        changeOrigin: true,
        rewrite: (path) => path // Сохраняем /api в запросах
      }
    }
  },
  build: {
    outDir: '../dist', // Куда собирать (относительно public)
    emptyOutDir: true
  }
});