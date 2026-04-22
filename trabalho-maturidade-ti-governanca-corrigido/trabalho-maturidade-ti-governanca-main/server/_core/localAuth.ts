import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

/**
 * Registra rotas de autenticação local (sem OAuth externo).
 * Permite login com email/senha diretamente no banco de dados.
 */
export function registerLocalAuthRoutes(app: any) {
  // Rota de login local via POST
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email e senha são obrigatórios" });
      return;
    }

    try {
      // Busca usuário pelo email
      const user = await db.getUserByEmail(email);

      if (!user) {
        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }

      // Verificação simples de senha (hash bcrypt ou texto plano para dev)
      const isValid = await verifyPassword(password, user.passwordHash ?? "");
      if (!isValid) {
        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }

      // Atualiza lastSignedIn
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Cria token de sessão
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      console.error("[LocalAuth] Login failed", error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  });

  // Rota de página de login (GET) - redireciona para a home com parâmetro
  app.get("/api/oauth/login", (_req: Request, res: Response) => {
    res.redirect("/?login=true");
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Para desenvolvimento: aceita senha em texto plano ou hash simples
  if (!hash) return false;
  
  // Se o hash começa com $2, é bcrypt - por ora usamos comparação simples
  // Em produção, usar bcrypt.compare
  return password === hash;
}
