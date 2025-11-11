import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: [
      '@symulate/sdk/persistence/filePersistence',
      'persistence/filePersistence'
    ]
  },
  resolve: {
    alias: {
      // Prevent Vite from trying to resolve Node.js-only modules
      './persistence/filePersistence': false,
      './persistence/filePersistence.js': false,
    }
  }
});
