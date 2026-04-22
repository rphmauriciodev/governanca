import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export default function AIQuestionsTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [framework, setFramework] = useState<"CMMI" | "ITIL" | "ISO">("CMMI");
  const [count, setCount] = useState("5");
  const [companyContext, setCompanyContext] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  const { data: frameworks } = trpc.ai.getFrameworks.useQuery();
  const { data: categories } = trpc.category.list.useQuery();
  const generateQuestionsMutation = trpc.ai.generateQuestions.useMutation();

  const handleGenerate = async () => {
    if (!categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateQuestionsMutation.mutateAsync({
        categoryId: parseInt(categoryId),
        framework,
        count: parseInt(count),
        companyContext: companyContext || undefined,
      });

      if (result.success) {
        setGeneratedQuestions(result.questions);
        toast.success(`${result.questions.length} questões geradas com sucesso!`);
      }
    } catch (error) {
      toast.error("Erro ao gerar questões com IA");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Geração Inteligente de Questões</h2>
          <p className="text-muted-foreground mt-1">
            Use IA para gerar questões de avaliação baseadas em frameworks de maturidade
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Gerar com IA
        </Button>
      </div>

      {generatedQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Questões Geradas</h3>
          <div className="grid gap-4">
            {generatedQuestions.map((q, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{q.text}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Categoria: {q.category}</span>
                      <span>Dificuldade: {q.difficulty}/5</span>
                      <span>Peso: {q.weight}/10</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Questões com IA</DialogTitle>
            <DialogDescription>
              Configure os parâmetros para gerar questões inteligentes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="framework">Framework de Maturidade</Label>
              <Select value={framework} onValueChange={(v) => setFramework(v as any)}>
                <SelectTrigger id="framework">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frameworks?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="count">Quantidade de Questões</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="context">Contexto da Empresa (Opcional)</Label>
              <Textarea
                id="context"
                placeholder="Ex: Empresa de tecnologia com 500 funcionários, foco em cloud computing..."
                value={companyContext}
                onChange={(e) => setCompanyContext(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !categoryId}
              className="w-full gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Gerando..." : "Gerar Questões"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
