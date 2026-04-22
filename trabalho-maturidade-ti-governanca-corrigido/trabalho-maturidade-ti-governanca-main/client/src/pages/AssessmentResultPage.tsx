import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowLeft, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AssessmentResultPageProps {
  assessmentId: number;
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

const maturityLevelDescriptions: Record<number, string> = {
  1: "Processos caóticos e não documentados. A TI opera de forma reativa, sem planejamento ou padrões definidos.",
  2: "Processos básicos estabelecidos e repetíveis. Existe alguma documentação, mas ainda há inconsistências.",
  3: "Processos documentados, padronizados e comunicados. A TI é gerenciada de forma proativa.",
  4: "Processos medidos, controlados e monitorados com métricas. A TI entrega resultados previsíveis.",
  5: "Processos continuamente melhorados e otimizados. A TI é um diferencial estratégico para o negócio.",
};

export default function AssessmentResultPage({ assessmentId }: AssessmentResultPageProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Queries
  const assessmentQuery = trpc.assessment.getById.useQuery({ id: assessmentId });
  const resultQuery = trpc.assessment.getResult.useQuery({ assessmentId });
  const categoriesQuery = trpc.category.list.useQuery();

  if (loading || assessmentQuery.isLoading || resultQuery.isLoading || categoriesQuery.isLoading) {
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

  if (!assessmentQuery.data || !resultQuery.data) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Resultado não encontrado. A avaliação pode não ter sido concluída ainda.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = resultQuery.data;
  const categories = categoriesQuery.data || [];

  // Build category name map
  const categoryNameMap: Record<number, string> = {};
  categories.forEach((cat) => {
    categoryNameMap[cat.id] = cat.name;
  });

  const categoryScores: Record<number, number> = typeof result.categoryScores === "string"
    ? JSON.parse(result.categoryScores)
    : (result.categoryScores as Record<number, number>);
  const categoryMaturityLevels: Record<number, number> = typeof result.categoryMaturityLevels === "string"
    ? JSON.parse(result.categoryMaturityLevels)
    : (result.categoryMaturityLevels as Record<number, number>);

  const overallScore = typeof result.overallScore === "string"
    ? parseFloat(result.overallScore)
    : result.overallScore;
  const overallLevel = typeof result.overallMaturityLevel === "string"
    ? parseInt(result.overallMaturityLevel as any)
    : result.overallMaturityLevel;

  // Prepare data for charts using real category names
  const radarData = Object.entries(categoryScores).map(([categoryId, score]) => ({
    category: categoryNameMap[parseInt(categoryId)] || `Categoria ${categoryId}`,
    score: typeof score === "string" ? parseFloat(score) : (score as number),
    fullMark: 5,
  }));

  const barData = Object.entries(categoryMaturityLevels).map(([categoryId, level]) => {
    const numLevel = typeof level === "string" ? parseInt(level as any) : (level as number);
    return {
      category: categoryNameMap[parseInt(categoryId)] || `Cat ${categoryId}`,
      level: numLevel,
      levelName: maturityLevelNames[numLevel],
    };
  });

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
              <h1 className="text-3xl font-bold text-foreground">Resultado da Avaliação</h1>
              <p className="text-muted-foreground mt-1">{assessmentQuery.data.title}</p>
            </div>
          </div>

          {/* Overall Score Card */}
          <Card className="card-elevated border-2">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-4">
                <div>
                  <div className="text-6xl font-bold text-accent">
                    {overallScore.toFixed(2)}
                  </div>
                  <p className="text-muted-foreground mt-2 text-lg">Score Geral de Maturidade (escala 1–5)</p>
                </div>
                <div
                  className="inline-block px-6 py-3 rounded-lg"
                  style={{ backgroundColor: maturityLevelColors[overallLevel] }}
                >
                  <p className="text-white font-semibold text-lg">
                    Nível {overallLevel}: {maturityLevelNames[overallLevel]}
                  </p>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
                  {maturityLevelDescriptions[overallLevel]}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Scores por Categoria</CardTitle>
                <CardDescription>Visualização em radar dos scores por dimensão</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value: any) => [Number(value).toFixed(2), "Score"]} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Nível de Maturidade por Categoria</CardTitle>
                <CardDescription>Nível atingido em cada dimensão avaliada</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => [
                        `Nível ${value} - ${maturityLevelNames[value]}`,
                        "Maturidade",
                      ]}
                    />
                    <Bar dataKey="level" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Análise Detalhada por Categoria
              </CardTitle>
              <CardDescription>Score e nível de maturidade em cada dimensão avaliada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryScores).map(([categoryId, score]) => {
                  const numCategoryId = parseInt(categoryId);
                  const level = categoryMaturityLevels[numCategoryId];
                  const numLevel = typeof level === "string" ? parseInt(level as any) : (level as number);
                  const numScore = typeof score === "string" ? parseFloat(score) : (score as number);
                  const categoryName = categoryNameMap[numCategoryId] || `Categoria ${numCategoryId}`;

                  return (
                    <div key={categoryId} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{categoryName}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {maturityLevelDescriptions[numLevel]?.split(".")[0]}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className="text-lg font-bold text-foreground">
                            {numScore.toFixed(1)}/5.0
                          </span>
                          <p
                            className="text-xs font-medium mt-0.5"
                            style={{ color: maturityLevelColors[numLevel] }}
                          >
                            Nível {numLevel}: {maturityLevelNames[numLevel]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(numScore / 5) * 100}%`,
                              backgroundColor: maturityLevelColors[numLevel],
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {Math.round((numScore / 5) * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Maturity Level Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Referência dos Níveis de Maturidade</CardTitle>
              <CardDescription>Descrição de cada nível do modelo de maturidade de TI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`p-3 rounded-lg border-l-4 ${
                      level === overallLevel ? "bg-accent/10 border-accent" : "bg-muted/30 border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: maturityLevelColors[level] }}
                      >
                        {level}
                      </span>
                      <span className="font-semibold text-foreground">
                        {maturityLevelNames[level]}
                        {level === overallLevel && (
                          <span className="ml-2 text-xs text-accent font-normal">(Nível atual)</span>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">
                      {maturityLevelDescriptions[level]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            {(user.role === "consultor" || user.role === "admin") && (
              <Button
                className="flex-1"
                onClick={() => navigate(`/generate-pdf/${assessmentId}`)}
              >
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório PDF
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
