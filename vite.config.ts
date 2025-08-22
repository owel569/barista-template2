import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: 'all',
    hmr: {
      clientPort: 443, // Configuration spéciale Replit
      protocol: 'wss' // WebSocket Secure
    }
  },
  build: {
    outDir: '../client/dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});