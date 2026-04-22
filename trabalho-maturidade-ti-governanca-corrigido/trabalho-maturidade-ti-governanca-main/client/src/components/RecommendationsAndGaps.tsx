import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, TrendingUp, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Gap {
  current: number;
  target: number;
  gap: number;
}

interface RecommendationsAndGapsProps {
  recommendations?: {
    roadmap?: string;
    quickWins?: string[];
    longTermStrategy?: string;
    estimatedTimeline?: string;
  } | null;
  gaps?: Record<string, Gap> | null;
  targetMaturityLevel?: number;
  isLoading?: boolean;
  error?: string | null;
}

export function RecommendationsAndGaps({
  recommendations,
  gaps,
  targetMaturityLevel = 5,
  isLoading = false,
  error = null,
}: RecommendationsAndGapsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!recommendations && !gaps) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nenhuma recomendação ou gap disponível ainda.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gaps Section */}
      {gaps && Object.keys(gaps).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              Lacunas de Maturidade (Gaps)
            </CardTitle>
            <CardDescription>
              Diferença entre o nível atual e o nível alvo ({targetMaturityLevel})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(gaps).map(([category, gap]) => (
                <div key={category} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{category}</h4>
                      <p className="text-sm text-muted-foreground">
                        Atual: Nível {gap.current} → Alvo: Nível {gap.target}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-yellow-600">
                        +{gap.gap}
                      </span>
                      <p className="text-xs text-muted-foreground">níveis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${((gap.target - gap.current) / gap.target) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {Math.round(((gap.target - gap.current) / gap.target) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Section */}
      {recommendations && (
        <div className="space-y-4">
          {/* Quick Wins */}
          {recommendations.quickWins && recommendations.quickWins.length > 0 && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Zap className="w-5 h-5" />
                  Quick Wins (Ações Imediatas)
                </CardTitle>
                <CardDescription>
                  Implementações rápidas que trarão resultados imediatos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.quickWins.map((win, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-semibold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-sm text-foreground">{win}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Roadmap */}
          {recommendations.roadmap && (
            <Card>
              <CardHeader>
                <CardTitle>Roadmap Estratégico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {recommendations.roadmap}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Long Term Strategy */}
          {recommendations.longTermStrategy && (
            <Card>
              <CardHeader>
                <CardTitle>Estratégia de Longo Prazo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {recommendations.longTermStrategy}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {recommendations.estimatedTimeline && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-blue-700">Timeline Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground font-medium">
                  {recommendations.estimatedTimeline}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
