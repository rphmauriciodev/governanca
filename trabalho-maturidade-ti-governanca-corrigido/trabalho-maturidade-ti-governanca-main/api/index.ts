import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerLocalAuthRoutes } from "../server/_core/localAuth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { serveStatic } from "../server/_core/vite";

async function getApp() {
  const app = express();
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Local auth routes (login sem OAuth externo)
  registerLocalAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // No Vercel, o frontend é servido nativamente via vercel.json.
  // Só servimos estáticos se NÃO estivermos na Vercel.
  if (process.env.NODE_ENV !== "development" && !process.env.VERCEL) {
    serveStatic(app);
  }

  return app;
}

// Export default for Vercel
export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}

// Suporte para rodar localmente se necessário
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  getApp().then(app => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  });
}
