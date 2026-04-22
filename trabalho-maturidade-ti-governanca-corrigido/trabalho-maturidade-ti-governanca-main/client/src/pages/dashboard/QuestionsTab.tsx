import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import QuestionForm from "@/components/QuestionForm";

interface QuestionsTabProps {
  userRole: string;
}

export default function QuestionsTab({ userRole }: QuestionsTabProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const categoriesQuery = trpc.category.list.useQuery();
  const questionsQuery = trpc.question.listByCategory.useQuery(
    { categoryId: selectedCategoryId || 0 },
    { enabled: !!selectedCategoryId }
  );

  const handleFormSuccess = () => {
    questionsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Questões de Avaliação</CardTitle>
          <CardDescription>Gerencie as questões organizadas por categorias de TI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Selecione uma categoria
            </label>
            <select
              value={selectedCategoryId || ""}
              onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">-- Selecione --</option>
              {categoriesQuery.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create Question Button */}
          {userRole === "admin" && selectedCategoryId && (
            <>
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nova Questão
              </Button>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl">
                  <QuestionForm
                    categoryId={selectedCategoryId}
                    onClose={() => setShowForm(false)}
                    onSuccess={handleFormSuccess}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Questions List */}
          {selectedCategoryId && (
            <div className="mt-6 space-y-3">
              {questionsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : questionsQuery.data && questionsQuery.data.length > 0 ? (
                questionsQuery.data.map((question) => (
                  <div
                    key={question.id}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-all duration-300 ease-in-out cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{question.text}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                      </div>
                      <span className="ml-4 badge-primary">Peso: {question.weight}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma questão encontrada
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
