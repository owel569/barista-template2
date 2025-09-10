
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
    jsxImportSource: 'react'
  })],
  server: {
    port: 5000,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: true,
    // Configuration HMR optimisée pour Replit
    hmr: process.env.REPL_ID ? false : {
      port: 24678,
      clientPort: 24678,
      overlay: false
    },
    // Configuration WebSocket pour Replit
    ws: process.env.REPL_ID ? false : undefined,
    // Configuration proxy pour éviter les conflits
    middlewareMode: false,
    fs: {
      // Autoriser l'accès aux fichiers de niveau supérieur
      allow: ['..']
    }
  },
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
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  },
  preview: {
    port: 5000,
    host: '0.0.0.0'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', '@radix-ui/react-dialog']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    global: 'globalThis'
  }
});
