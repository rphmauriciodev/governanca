import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  BarChart3,
  ClipboardList,
  Play,
  Eye,
  CheckCircle,
  Clock,
  LogOut,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  in_progress: "Em Andamento",
  completed: "Concluída",
  archived: "Arquivada",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function ClientAssessmentsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
    if (!loading && isAuthenticated && user && user.role !== "cliente") {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, user, navigate]);

  const companyQuery = trpc.company.getById.useQuery(
    { id: user?.companyId || 0 },
    { enabled: !!user?.companyId }
  );

  const assessmentsQuery = trpc.assessment.listByCompany.useQuery(
    { companyId: user?.companyId || 0 },
    { enabled: !!user?.companyId }
  );

  if (loading || companyQuery.isLoading || assessmentsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const assessments = assessmentsQuery.data || [];
  const completedCount = assessments.filter((a) => a.status === "completed").length;
  const inProgressCount = assessments.filter((a) => a.status === "in_progress").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none">TI Maturity</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {companyQuery.data?.name || "Portal do Cliente"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.name}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Bem-vindo, {user.name?.split(" ")[0]}!
            </h2>
            <p className="text-muted-foreground mt-1">
              Aqui estão as avaliações de maturidade de TI disponíveis para sua empresa.
            </p>
          </div>

          {/* Summary Cards */}
          {user.companyId && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{assessments.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{inProgressCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Em Andamento</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assessments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-accent" />
                Minhas Avaliações
              </CardTitle>
              <CardDescription>
                {user.companyId
                  ? "Avaliações de maturidade de TI atribuídas à sua empresa"
                  : "Nenhuma empresa vinculada ao seu perfil. Contate o administrador."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user.companyId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Seu perfil não está vinculado a nenhuma empresa.</p>
                  <p className="text-sm mt-1">Entre em contato com o administrador do sistema.</p>
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma avaliação disponível no momento.</p>
                  <p className="text-sm mt-1">O consultor responsável criará avaliações em breve.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="p-4 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-foreground">{assessment.title}</h4>
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusColors[assessment.status]}`}
                            >
                              {assessment.status === "completed" ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {statusLabels[assessment.status]}
                            </span>
                          </div>
                          {assessment.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {assessment.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Criada em {new Date(assessment.createdAt).toLocaleDateString("pt-BR")}
                            {assessment.completedAt && (
                              <>
                                {" "}
                                · Concluída em{" "}
                                {new Date(assessment.completedAt).toLocaleDateString("pt-BR")}
                              </>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          {assessment.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/assessment/${assessment.id}`)}
                              className="text-xs"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Continuar
                            </Button>
                          )}
                          {assessment.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/assessment-result/${assessment.id}`)}
                              className="text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver Resultado
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
