import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface GeneratePDFPageProps {
  assessmentId: number;
}

export default function GeneratePDFPage({ assessmentId }: GeneratePDFPageProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);

  // Queries
  const assessmentQuery = trpc.assessment.getById.useQuery({ id: assessmentId });
  const resultQuery = trpc.assessment.getResult.useQuery({ assessmentId });

  // Mutations
  const generatePDFMutation = trpc.assessment.generatePDF.useMutation();

  if (loading || assessmentQuery.isLoading || resultQuery.isLoading) {
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
            <p className="text-center text-muted-foreground">Resultado não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const response = await generatePDFMutation.mutateAsync({ assessmentId });

      // Abre uma nova janela/aba com o conteúdo do relatório
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("O bloqueador de pop-ups impediu a abertura do relatório.");
      }

      // Escreve o HTML do relatório na nova janela
      printWindow.document.open();
      printWindow.document.write(response.htmlContent || "");
      printWindow.document.close();

      // Dá um tempo para o navegador processar o estilo e abre a janela de impressão (Salvar como PDF)
      setTimeout(() => {
        printWindow.print();
        // Opcional: fecha a janela após a impressão/cancelamento
        // printWindow.close();
      }, 500);

      toast.success("Relatório preparado para impressão/PDF!");
    } catch (error: any) {
      console.error("Erro ao preparar PDF:", error);
      toast.error(error.message || "Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(`/assessment-result/${assessmentId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gerar Relatório em PDF</h1>
              <p className="text-muted-foreground mt-1">{assessmentQuery.data.title}</p>
            </div>
          </div>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Relatório Personalizado</CardTitle>
              <CardDescription>
                Seu relatório incluirá análise contextual com recomendações específicas geradas por IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                    <span className="text-sm font-semibold text-accent">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Scores segmentados por categoria</p>
                    <p className="text-sm text-muted-foreground">Visualização clara dos resultados em cada dimensão</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                    <span className="text-sm font-semibold text-accent">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Gráficos profissionais</p>
                    <p className="text-sm text-muted-foreground">Radar e barras para fácil compreensão</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                    <span className="text-sm font-semibold text-accent">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Análise com IA</p>
                    <p className="text-sm text-muted-foreground">Recomendações contextualizadas para sua empresa</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                    <span className="text-sm font-semibold text-accent">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Plano de ação</p>
                    <p className="text-sm text-muted-foreground">Próximos passos para melhorar a maturidade</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Gerar e Baixar Relatório em PDF
              </>
            )}
          </Button>

          {/* Info */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                O PDF será gerado com análise contextual baseada em IA, incluindo recomendações específicas para sua empresa.
                Este processo pode levar alguns segundos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
