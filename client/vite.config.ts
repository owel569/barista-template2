
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement
  const env = loadEnv(mode, process.cwd(), '');
  
  const isReplit = !!env.REPL_ID;
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: isReplit ? true : ['localhost'],
      
      // Configuration HMR pour Replit
      hmr: isReplit ? {
        clientPort: 443,
        protocol: 'wss',
        timeout: 30000,
        overlay: false
      } : undefined,
      
      // Proxy pour l'API en développement
      proxy: !isProduction ? {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      } : undefined,

      fs: {
        deny: ["**/.*"],
      },
    },
    
    // Variables d'environnement accessibles côté client
    define: {
      'process.env.REPL_ID': JSON.stringify(env.REPL_ID || ''),
      'process.env.IS_REPLIT': JSON.stringify(!!env.REPL_ID)
    },
    
    build: {
      outDir: '../dist/client',
      emptyOutDir: true,
      sourcemap: !isProduction
    },
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "..", "shared"),
        "@assets": path.resolve(__dirname, "..", "attached_assets"),
      }
    },
    
    preview: {
      port: 3000,
    },
    
    // Optimisations pour Replit
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react']
    }
  };
});
