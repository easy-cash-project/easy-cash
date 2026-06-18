import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Try multiple possible paths for dist/public
  const possiblePaths = [
    path.resolve(import.meta.dirname, "../../../dist/public"),
    path.resolve(import.meta.dirname, "../../dist/public"),
    path.resolve(import.meta.dirname, "../dist/public"),
    path.resolve(process.cwd(), "dist/public"),
  ];

  let distPath: string | null = null;
  for (const p of possiblePaths) {
    console.log(`Checking for dist at: ${p}`);
    if (fs.existsSync(p)) {
      distPath = p;
      console.log(`Found dist at: ${distPath}`);
      break;
    }
  }

  if (!distPath) {
    console.error(`Could not find dist/public in any of these locations:`);
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    // Serve a 500 error page instead of crashing
    app.use("*", (_req, res) => {
      res.status(500).send("Build directory not found. Please rebuild the application.");
    });
    return;
  }

  app.use(express.static(distPath, { maxAge: "1h" }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
