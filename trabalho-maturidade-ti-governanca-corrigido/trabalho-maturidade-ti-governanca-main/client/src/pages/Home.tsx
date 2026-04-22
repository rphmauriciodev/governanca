import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Loader2, BarChart3, ClipboardList, FileText, LogIn, AlertCircle } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Verifica se deve abrir o modal de login automaticamente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "true") {
      setShowLogin(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect based on role
      if (user.role === "admin" || user.role === "consultor") {
        navigate("/dashboard");
      } else if (user.role === "cliente") {
        navigate("/client-assessments");
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || "Erro ao fazer login");
        return;
      }

      // Atualiza o estado de autenticação
      await refresh();
    } catch {
      setLoginError("Erro de conexão. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header */}
        <header className="border-b border-border/50">
          <div className="container py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-accent-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">TI Maturity</h1>
            </div>
            <Button onClick={() => setShowLogin(true)} variant="outline" className="gap-2">
              <LogIn className="w-4 h-4" />
              Entrar
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="container py-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-foreground leading-tight">
                Avaliação de Maturidade de TI
              </h2>
              <p className="text-xl text-muted-foreground">
                Plataforma sofisticada para avaliar e melhorar a maturidade tecnológica da sua empresa
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="rounded-lg border bg-card p-6 text-left shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Avaliações Estruturadas</h3>
                <p className="text-sm text-muted-foreground">
                  Questões organizadas por categorias de TI com análise detalhada
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6 text-left shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Scores Segmentados</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize resultados por categoria e score geral de maturidade
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6 text-left shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Relatórios em PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Gere relatórios profissionais com recomendações personalizadas
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12">
              <Button size="lg" className="px-8" onClick={() => setShowLogin(true)}>
                Entrar na Plataforma
              </Button>
            </div>
          </div>
        </div>

        {/* Modal de Login */}
        {showLogin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Entrar na Plataforma
                </CardTitle>
                <CardDescription>
                  Use suas credenciais para acessar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {loginError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowLogin(false);
                        setLoginError("");
                        setEmail("");
                        setPassword("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loginLoading}>
                      {loginLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      window.location.href = "/api/auth/google";
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Entrar com Google
                  </Button>

                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    <p className="font-medium mb-1">Credenciais de acesso:</p>
                    <p>Admin: <code className="bg-muted px-1 rounded">admin@ti.local</code> / <code className="bg-muted px-1 rounded">admin123</code></p>
                    <p>Consultor: <code className="bg-muted px-1 rounded">consultor@ti.local</code> / <code className="bg-muted px-1 rounded">consultor123</code></p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-border/50 mt-20">
          <div className="container py-8 text-center text-sm text-muted-foreground">
            <p>© 2026 TI Maturity Assessment. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}
