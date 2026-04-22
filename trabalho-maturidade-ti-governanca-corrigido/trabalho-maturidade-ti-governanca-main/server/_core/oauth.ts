import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

export function registerOAuthRoutes(app: any) {
  // Rota para iniciar o login com Google
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: ENV.googleRedirectUri,
      client_id: ENV.googleClientId,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
  });

  // Rota de callback do Google
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
      res.status(400).json({ error: "Authorization code missing" });
      return;
    }

    try {
      console.log("[OAuth] Callback recebido, trocando código por token...");
      // Troca o código pelo token
      const { accessToken } = await sdk.exchangeCodeForToken(code);
      
      console.log("[OAuth] Buscando informações do usuário no Google...");
      // Busca informações do usuário no Google
      const userInfo = await sdk.getUserInfo(accessToken);
      console.log(`[OAuth] Usuário identificado: ${userInfo.email} (${userInfo.openId})`);

      // Cria ou atualiza o usuário no banco local
      // Para fins de teste, vamos garantir que o usuário seja admin
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: "google",
        role: "admin", // Forçando admin para teste
        lastSignedIn: new Date(),
      });

      console.log("[OAuth] Usuário salvo/atualizado no banco. Gerando sessão...");

      // Cria o token de sessão do nosso app
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        email: userInfo.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redireciona para a home
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Google login failed", error);
      res.status(500).json({ error: "Google login failed" });
    }
  });
}
