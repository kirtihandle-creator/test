import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server on 5173; API calls to /api/v1 are proxied to the Express server on 4000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
