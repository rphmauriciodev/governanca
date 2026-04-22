import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface AssessmentHistoryPageProps {
  companyId: number;
}

const maturityLevelNames: Record<number, string> = {
  1: "Inicial",
  2: "Repetível",
  3: "Definido",
  4: "Gerenciado",
  5: "Otimizado",
};

const maturityLevelColors: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#84cc16",
  5: "#22c55e",
};

function AssessmentResultLoader({ assessmentId }: { assessmentId: number }) {
  const resultQuery = trpc.assessment.getResult.useQuery({ assessmentId });
  return resultQuery.data ? (
    <span
      className="text-sm font-semibold"
      style={{
        color:
          maturityLevelColors[
            typeof resultQuery.data.overallMaturityLevel === "string"
              ? parseInt(resultQuery.data.overallMaturityLevel as any)
              : resultQuery.data.overallMaturityLevel
          ],
      }}
    >
      Score:{" "}
      {(typeof resultQuery.data.overallScore === "string"
        ? parseFloat(resultQuery.data.overallScore)
        : resultQuery.data.overallScore
      ).toFixed(2)}{" "}
      — Nível{" "}
      {typeof resultQuery.data.overallMaturityLevel === "string"
        ? parseInt(resultQuery.data.overallMaturityLevel as any)
        : resultQuery.data.overallMaturityLevel}
      :{" "}
      {
        maturityLevelNames[
          typeof resultQuery.data.overallMaturityLevel === "string"
            ? parseInt(resultQuery.data.overallMaturityLevel as any)
            : resultQuery.data.overallMaturityLevel
        ]
      }
    </span>
  ) : null;
}

export default function AssessmentHistoryPage({ companyId }: AssessmentHistoryPageProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const companyQuery = trpc.company.getById.useQuery({ id: companyId });
  const assessmentsQuery = trpc.assessment.listByCompany.useQuery({ companyId });

  // Load results for all completed assessments
  const completedIds =
    assessmentsQuery.data?.filter((a) => a.status === "completed").map((a) => a.id) || [];

  if (loading || companyQuery.isLoading || assessmentsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate("/");
    return null;
  }

  if (!companyQuery.data || !assessmentsQuery.data) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Dados não encontrados</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedAssessments = assessmentsQuery.data.filter((a) => a.status === "completed");
  const allAssessments = assessmentsQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Histórico de Avaliações</h1>
              <p className="text-muted-foreground mt-1">{companyQuery.data.name}</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-foreground">{allAssessments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Total de Avaliações</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-green-600">{completedAssessments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {allAssessments.filter((a) => a.status === "in_progress").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Em Andamento</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-gray-500">
                  {allAssessments.filter((a) => a.status === "draft").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Rascunhos</p>
              </CardContent>
            </Card>
          </div>

          {/* Evolution Chart - only shown when there are results */}
          {completedAssessments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Evolução de Maturidade
                </CardTitle>
                <CardDescription>
                  Acesse cada avaliação concluída para ver o score real no gráfico de evolução
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Clique em "Ver Resultado" em cada avaliação abaixo para visualizar os scores detalhados e gráficos interativos.
                </p>
                <div className="space-y-2">
                  {completedAssessments
                    .sort((a, b) => new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime())
                    .map((assessment, idx) => (
                      <div key={assessment.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{assessment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(assessment.completedAt || "").toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <AssessmentResultLoader assessmentId={assessment.id} />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessments List */}
          <Card>
            <CardHeader>
              <CardTitle>Todas as Avaliações</CardTitle>
              <CardDescription>
                {allAssessments.length} avaliação(ões) registrada(s) para esta empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allAssessments.length > 0 ? (
                <div className="space-y-3">
                  {allAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-foreground">{assessment.title}</h4>
                            {assessment.status === "completed" ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="w-3 h-3" />
                                Concluída
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                <Clock className="w-3 h-3" />
                                {assessment.status === "in_progress" ? "Em Andamento" : "Rascunho"}
                              </span>
                            )}
                          </div>
                          {assessment.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {assessment.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Criada em {new Date(assessment.createdAt).toLocaleDateString("pt-BR")}
                            {assessment.completedAt && (
                              <> · Concluída em {new Date(assessment.completedAt).toLocaleDateString("pt-BR")}</>
                            )}
                          </p>
                        </div>
                        {assessment.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/assessment-result/${assessment.id}`)}
                            className="shrink-0"
                          >
                            Ver Resultado
                          </Button>
                        )}
                        {assessment.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/assessment/${assessment.id}`)}
                            className="shrink-0"
                          >
                            Continuar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma avaliação registrada para esta empresa
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
