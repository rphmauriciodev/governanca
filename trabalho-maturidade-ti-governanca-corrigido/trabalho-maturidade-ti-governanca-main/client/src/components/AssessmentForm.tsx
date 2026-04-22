import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AssessmentFormProps {
  onClose: () => void;
  onSuccess?: (assessmentId: number) => void;
}

export default function AssessmentForm({ onClose, onSuccess }: AssessmentFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    companyId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const companiesQuery = trpc.company.list.useQuery();
  const createAssessmentMutation = trpc.assessment.create.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Título da avaliação é obrigatório");
      return;
    }
    if (!formData.companyId) {
      toast.error("Selecione uma empresa");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAssessmentMutation.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        companyId: parseInt(formData.companyId),
      });
      toast.success("Avaliação criada com sucesso!");
      onSuccess?.(result as any);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar avaliação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Nova Avaliação</CardTitle>
          <CardDescription>Crie uma nova avaliação de maturidade de TI</CardDescription>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Empresa *
            </label>
            <Select value={formData.companyId} onValueChange={(v) => setFormData((p) => ({ ...p, companyId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {companiesQuery.data?.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Título da Avaliação *
            </label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Avaliação de Maturidade TI 2026"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Descrição
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva o objetivo desta avaliação..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
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
                "Criar Avaliação"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
