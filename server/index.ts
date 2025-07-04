import dotenv from 'dotenv';
dotenv.config();

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
  // Configuration PostgreSQL automatique
  try {
    const { setupPostgres, ensurePostgresRunning } = await import("./postgres-setup");
    
    if (!await ensurePostgresRunning()) {
      console.log("🔧 Configuration PostgreSQL nécessaire...");
      const databaseUrl = await setupPostgres();
      process.env.DATABASE_URL = databaseUrl;
    } else {
      console.log("✅ PostgreSQL déjà en cours d'exécution");
    }
  } catch (error) {
    console.error("Erreur PostgreSQL:", error instanceof Error ? error.message : 'Erreur inconnue');
    console.log("⚠️  Tentative de démarrage avec la configuration existante...");
  }

  // Configuration automatique au démarrage
  try {
    const { autoSetup } = await import("./auto-setup");
    const setupSuccess = await autoSetup();
    
    if (!setupSuccess) {
      console.error('❌ Impossible de démarrer le serveur - configuration échouée');
      process.exit(1);
    }
  } catch (error) {
    console.error("Erreur de configuration automatique:", error instanceof Error ? error.message : 'Erreur inconnue');
    process.exit(1);
  }

  // Initialize database with default data
  try {
    const { initializeDatabase } = await import("./init-db");
    await initializeDatabase();
  } catch (error) {
    console.log("Échec de l'initialisation de la base de données:", error instanceof Error ? error.message : 'Erreur inconnue');
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
