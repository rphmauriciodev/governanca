console.log("[Server] Arquivo api/index.ts carregado com sucesso!");
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from '../server/_core/oauth';
import { registerLocalAuthRoutes } from '../server/_core/localAuth';
import { appRouter } from '../server/routers';
import { createContext } from '../server/_core/context';

// Cache do app para evitar recriar em cada requisição na Vercel
let appCache: any = null;

async function getApp() {
  if (appCache) return appCache;

  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Rota de teste para ver se o servidor ligou
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Servidor ativo!",
      env: process.env.NODE_ENV,
      db_configured: !!process.env.DATABASE_URL
    });
  });

  // Rotas de autenticação
  registerOAuthRoutes(app);
  registerLocalAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  appCache = app;

  // Debug: capturar rotas que não batem com nada
  app.use((req, res) => {
    console.log(`[Express] Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "Rota não encontrada no Express", 
      method: req.method, 
      url: req.url,
      registered_routes: ["/api/health", "/api/trpc", "/api/auth/login", "/api/auth/google"]
    });
  });

  return app;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error: any) {
    console.error("Critical Server Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}
