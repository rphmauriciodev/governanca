import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface QuestionFormProps {
  categoryId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuestionForm({ categoryId, onClose, onSuccess }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    text: "",
    description: "",
    weight: "1.00",
    order: "0",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createQuestionMutation = trpc.question.create.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.text.trim()) {
      toast.error("Texto da questão é obrigatório");
      return;
    }

    setIsSubmitting(true);
    try {
      await createQuestionMutation.mutateAsync({
        categoryId,
        text: formData.text,
        description: formData.description,
        weight: formData.weight,
        order: parseInt(formData.order),
      });
      toast.success("Questão criada com sucesso!");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar questão");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Nova Questão</CardTitle>
          <CardDescription>Cadastre uma nova questão de avaliação</CardDescription>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Texto da Questão *
            </label>
            <Textarea
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="Digite a questão de avaliação..."
              rows={4}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Descrição/Contexto
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Adicione contexto ou orientações para responder..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Peso (0.00 - 10.00)
              </label>
              <Input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="10"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Ordem
              </label>
              <Input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Questão"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
