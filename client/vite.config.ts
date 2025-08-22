import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
      "@assets": path.resolve(__dirname, "..", "attached_assets"),
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['all'],
    fs: {
      deny: ["**/.*"],
    },
  },
  preview: {
    port: 3000,
  },
});