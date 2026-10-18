import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server only. If the project lives on an external/E: drive and Vite crashes with
// "UNKNOWN: stat", start it with:  VITE_POLL=1 npm run dev   (Windows CMD: set VITE_POLL=1 && npm run dev)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
    watch: process.env.VITE_POLL ? { usePolling: true, interval: 300 } : undefined,
  },
});
