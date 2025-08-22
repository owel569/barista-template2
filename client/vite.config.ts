
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: 'all',
    hmr: false  // Désactiver complètement HMR sur Replit
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
        // Ignorer les avertissements de module circulaire
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  },
  preview: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', '@radix-ui/react-dialog']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
