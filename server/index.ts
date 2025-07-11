import dotenv from 'dotenv';
dotenv.config();

// Gestionnaire d'erreurs globales pour éviter les promesses non gérées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse non gérée:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Exception non gérée:', error);
});

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Configuration PostgreSQL automatique - en arrière-plan
  setTimeout(async () => {
    try {
      const { getDb } = await import("./db");
      await getDb();
      console.log("✅ PostgreSQL configuré automatiquement");
      
      // Configuration automatique au démarrage
      const { autoSetup } = await import("./auto-setup");
      await autoSetup();
      console.log("✅ Configuration automatique terminée");
      
      // Initialize database with default data
      const { initializeDatabase } = await import("./init-db");
      await initializeDatabase();
      console.log("✅ Base de données initialisée");
    } catch (error) {
      console.log("⚠️  Base de données non disponible - le serveur continue de fonctionner");
    }
  }, 1000); // Délai de 1 seconde après le démarrage

  // Enregistrer d'abord les routes API AVANT le middleware Vite
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Configuration Vite APRÈS les routes API pour éviter les conflits
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
})();
