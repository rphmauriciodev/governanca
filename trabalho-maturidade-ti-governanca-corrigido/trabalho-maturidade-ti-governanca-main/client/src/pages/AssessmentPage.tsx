import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AssessmentPageProps {
  assessmentId: number;
}

export default function AssessmentPage({ assessmentId }: AssessmentPageProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { score: number; notes: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const assessmentQuery = trpc.assessment.getById.useQuery({ id: assessmentId });
  const questionsQuery = trpc.question.list.useQuery();
  const answersQuery = trpc.assessment.getAnswers.useQuery({ assessmentId });

  // Mutations
  const saveAnswerMutation = trpc.assessment.saveAnswer.useMutation();
  const updateAssessmentMutation = trpc.assessment.update.useMutation();

  // Load existing answers
  useEffect(() => {
    if (answersQuery.data) {
      const loadedAnswers: Record<number, { score: number; notes: string }> = {};
      answersQuery.data.forEach((answer) => {
        loadedAnswers[answer.questionId] = {
          score: answer.score,
          notes: answer.notes || "",
        };
      });
      setAnswers(loadedAnswers);
    }
  }, [answersQuery.data]);

  if (loading || assessmentQuery.isLoading || questionsQuery.isLoading) {
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

  if (!assessmentQuery.data || !questionsQuery.data) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Avaliação não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = questionsQuery.data;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentAnswer = answers[currentQuestion?.id] || { score: 0, notes: "" };

  const handleScoreChange = (score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        score,
      },
    }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        notes: e.target.value,
      },
    }));
  };

  const handleSaveAndNext = async () => {
    if (currentAnswer.score === 0) {
      toast.error("Selecione uma pontuação antes de continuar");
      return;
    }

    setIsSaving(true);
    try {
      await saveAnswerMutation.mutateAsync({
        assessmentId,
        questionId: currentQuestion.id,
        score: currentAnswer.score,
        notes: currentAnswer.notes,
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Mark assessment as completed
        await updateAssessmentMutation.mutateAsync({
          id: assessmentId,
          status: "completed",
          completedAt: new Date(),
        });
        toast.success("Avaliação concluída com sucesso!");
        navigate(`/assessment-result/${assessmentId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar resposta");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{assessmentQuery.data.title}</h1>
            <p className="text-muted-foreground mt-2">{assessmentQuery.data.description}</p>
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Questão {currentQuestionIndex + 1} de {questions.length}
                  </span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
              {currentQuestion.description && (
                <CardDescription className="mt-2">{currentQuestion.description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Score Selection */}
              <div>
                <Label className="text-base font-semibold text-foreground mb-4 block">
                  Nível de Maturidade (1-5)
                </Label>
                <RadioGroup value={currentAnswer.score?.toString()} onValueChange={(v) => handleScoreChange(parseInt(v))}>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <div key={score} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value={score.toString()} id={`score-${score}`} />
                        <Label htmlFor={`score-${score}`} className="flex-1 cursor-pointer">
                          <span className="font-medium">Nível {score}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {score === 1 && "Inicial"}
                            {score === 2 && "Repetível"}
                            {score === 3 && "Definido"}
                            {score === 4 && "Gerenciado"}
                            {score === 5 && "Otimizado"}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-base font-semibold text-foreground mb-2 block">
                  Notas/Justificativa (Opcional)
                </Label>
                <Textarea
                  id="notes"
                  value={currentAnswer.notes}
                  onChange={handleNotesChange}
                  placeholder="Adicione comentários ou justificativas para esta resposta..."
                  rows={4}
                />
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0 || isSaving}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                <Button
                  onClick={handleSaveAndNext}
                  disabled={isSaving || currentAnswer.score === 0}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : currentQuestionIndex === questions.length - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Concluir
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question Indicators */}
          <div className="flex flex-wrap gap-2 justify-center">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  idx === currentQuestionIndex
                    ? "bg-accent text-accent-foreground"
                    : answers[q.id]?.score
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
