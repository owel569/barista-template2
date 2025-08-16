import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server },         // ✅ utilise bien le paramètre `server`
      allowedHosts: true,      // ✅ à l'intérieur de `server`
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

    // Middleware catch-all SEULEMENT pour les routes non-API
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      // Ignorer les routes API - les laisser passer
      if (url.startsWith('/api/')) {
        return next();
      }

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        if (!fs.existsSync(clientTemplate)) {
          console.error('Template HTML non trouvé:', clientTemplate);
          return next();
        }

        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );

        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        console.error('Erreur transformation HTML:', e);
        if (vite?.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e as Error);
        }
        next(e);
      }
    });
}


export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (SEULEMENT pour les routes non-API)
  app.use("*", (req, res) => {
    // Ignorer les routes API - les laisser passer
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }

    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    } else {
      return res.status(404).send('Index file not found');
    }
  });
}