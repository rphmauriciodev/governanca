import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Play, Eye, CheckCircle, Clock, FileText, Archive } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AssessmentForm from "@/components/AssessmentForm";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface AssessmentsTabProps {
  userRole: string;
}

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

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="w-3 h-3" />,
  in_progress: <Play className="w-3 h-3" />,
  completed: <CheckCircle className="w-3 h-3" />,
  archived: <Archive className="w-3 h-3" />,
};

export default function AssessmentsTab({ userRole }: AssessmentsTabProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, navigate] = useLocation();

  const companiesQuery = trpc.company.list.useQuery();
  const assessmentsQuery = trpc.assessment.listByCompany.useQuery(
    { companyId: selectedCompanyId || 0 },
    { enabled: !!selectedCompanyId }
  );
  const updateAssessmentMutation = trpc.assessment.update.useMutation();

  const handleFormSuccess = () => {
    assessmentsQuery.refetch();
  };

  const handleStartAssessment = async (assessmentId: number) => {
    try {
      await updateAssessmentMutation.mutateAsync({
        id: assessmentId,
        status: "in_progress",
        startedAt: new Date(),
      });
      navigate(`/assessment/${assessmentId}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar avaliação");
    }
  };

  const handleContinueAssessment = (assessmentId: number) => {
    navigate(`/assessment/${assessmentId}`);
  };

  const handleViewResult = (assessmentId: number) => {
    navigate(`/assessment-result/${assessmentId}`);
  };

  const handleGeneratePDF = (assessmentId: number) => {
    navigate(`/generate-pdf/${assessmentId}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Avaliações de Maturidade de TI</CardTitle>
          <CardDescription>Gerencie as avaliações de maturidade das empresas clientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Selecione uma empresa para ver as avaliações
            </label>
            <select
              value={selectedCompanyId || ""}
              onChange={(e) => setSelectedCompanyId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">-- Selecione uma empresa --</option>
              {companiesQuery.data?.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create Assessment Button */}
          {(userRole === "consultor" || userRole === "admin") && selectedCompanyId && (
            <>
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-lg">
                  <AssessmentForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                      setShowForm(false);
                      handleFormSuccess();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Assessments List */}
          {selectedCompanyId && (
            <div className="mt-4 space-y-3">
              {assessmentsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : assessmentsQuery.data && assessmentsQuery.data.length > 0 ? (
                assessmentsQuery.data.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="p-4 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground">{assessment.title}</h4>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusColors[assessment.status]}`}>
                            {statusIcons[assessment.status]}
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
                            <> · Concluída em {new Date(assessment.completedAt).toLocaleDateString("pt-BR")}</>
                          )}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {assessment.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => handleStartAssessment(assessment.id)}
                            disabled={updateAssessmentMutation.isPending}
                            className="text-xs"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Iniciar
                          </Button>
                        )}
                        {assessment.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => handleContinueAssessment(assessment.id)}
                            className="text-xs"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Continuar
                          </Button>
                        )}
                        {assessment.status === "completed" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewResult(assessment.id)}
                              className="text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver Resultado
                            </Button>
                            {(userRole === "consultor" || userRole === "admin") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGeneratePDF(assessment.id)}
                                className="text-xs"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Gerar PDF
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma avaliação encontrada para esta empresa.</p>
                  {(userRole === "consultor" || userRole === "admin") && (
                    <p className="text-sm mt-1">Clique em "Nova Avaliação" para criar uma.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
