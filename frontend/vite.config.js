import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // The browser only ever sees this origin. Vite forwards /api to the
    // Express server, so the frontend has no host or port baked in and the
    // browser makes no cross-origin request.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
