import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, CheckCircle, AlertCircle, Clock } from \"lucide-react\";
import { Label } from \"@/components/ui/label\";

interface ActionPlan {
  id: number;
  assessmentId: number;
  title: string;
  description?: string;
  what: string;
  why: string;
  where_location: string;
  when_date?: Date;
  who?: string;
  how: string;
  how_much?: number;
  priority: \"baixa\" | \"media\" | \"alta\" | \"critica\";
  status: \"planejado\" | \"em_progresso\" | \"concluido\" | \"cancelado\";
  createdAt: Date;
  updatedAt: Date;
}

interface ActionPlanManagerProps {
  assessmentId: number;
  plans: ActionPlan[];
  isLoading?: boolean;
  onCreatePlan?: (plan: Omit<ActionPlan, \"id\" | \"createdAt\" | \"updatedAt\">) => Promise<void>;
  onUpdateStatus?: (planId: number, status: ActionPlan[\"status\"]) => Promise<void>;
}

const priorityColors: Record<string, string> = {
  baixa: \"bg-blue-100 text-blue-800\",
  media: \"bg-yellow-100 text-yellow-800\",
  alta: \"bg-orange-100 text-orange-800\",
  critica: \"bg-red-100 text-red-800\",
};

const statusIcons: Record<string, React.ReactNode> = {
  planejado: <Clock className=\"w-4 h-4\" />,
  em_progresso: <Loader2 className=\"w-4 h-4 animate-spin\" />,
  concluido: <CheckCircle className=\"w-4 h-4\" />,
  cancelado: <AlertCircle className=\"w-4 h-4\" />,
};

export function ActionPlanManager({
  assessmentId,
  plans = [],
  isLoading = false,
  onCreatePlan,
  onUpdateStatus,
}: ActionPlanManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: \"\",
    description: \"\",
    what: \"\",
    why: \"\",
    where_location: \"\",
    when_date: \"\",
    who: \"\",
    how: \"\",
    how_much: \"\",
    priority: \"media\" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreatePlan) return;

    setIsSubmitting(true);
    try {
      await onCreatePlan({
        assessmentId,
        title: formData.title,
        description: formData.description || undefined,
        what: formData.what,
        why: formData.why,
        where_location: formData.where_location,
        when_date: formData.when_date ? new Date(formData.when_date) : undefined,
        who: formData.who || undefined,
        how: formData.how,
        how_much: formData.how_much ? parseFloat(formData.how_much) : undefined,
        priority: formData.priority,
        status: \"planejado\",
      });
      setFormData({
        title: \"\",
        description: \"\",
        what: \"\",
        why: \"\",
        where_location: \"\",
        when_date: \"\",
        who: \"\",
        how: \"\",
        how_much: \"\",
        priority: \"media\",
      });
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (\n      <div className=\"flex items-center justify-center py-8\">\n        <Loader2 className=\"w-6 h-6 animate-spin text-accent\" />\n      </div>\n    );\n  }

  return (\n    <div className=\"space-y-4\">\n      <div className=\"flex items-center justify-between\">\n        <div>\n          <h3 className=\"text-lg font-semibold\">Planos de Ação (5W2H)</h3>\n          <p className=\"text-sm text-muted-foreground mt-1\">\n            Gerencie ações para melhorar a maturidade de TI\n          </p>\n        </div>\n        <Dialog open={isOpen} onOpenChange={setIsOpen}>\n          <DialogTrigger asChild>\n            <Button>\n              <Plus className=\"w-4 h-4 mr-2\" />\n              Novo Plano\n            </Button>\n          </DialogTrigger>\n          <DialogContent className=\"max-w-2xl\">\n            <DialogHeader>\n              <DialogTitle>Criar Novo Plano de Ação</DialogTitle>\n              <DialogDescription>\n                Preencha os detalhes do plano usando a metodologia 5W2H\n              </DialogDescription>\n            </DialogHeader>\n            <form onSubmit={handleSubmit} className=\"space-y-4\">\n              <div className=\"grid grid-cols-2 gap-4\">\n                <div className=\"col-span-2\">\n                  <Label htmlFor=\"title\">Título</Label>\n                  <Input\n                    id=\"title\"\n                    value={formData.title}\n                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}\n                    placeholder=\"Título do plano de ação\"\n                    required\n                  />\n                </div>\n                <div className=\"col-span-2\">\n                  <Label htmlFor=\"description\">Descrição</Label>\n                  <Textarea\n                    id=\"description\"\n                    value={formData.description}\n                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}\n                    placeholder=\"Descrição geral do plano\"\n                    rows={2}\n                  />\n                </div>\n                <div>\n                  <Label htmlFor=\"what\">O Quê? (What)</Label>\n                  <Textarea\n                    id=\"what\"\n                    value={formData.what}\n                    onChange={(e) => setFormData({ ...formData, what: e.target.value })}\n                    placeholder=\"O que precisa ser feito?\"\n                    required\n                    rows={2}\n                  />\n                </div>\n                <div>\n                  <Label htmlFor=\"why\">Por Quê? (Why)</Label>\n                  <Textarea\n                    id=\"why\"\n                    value={formData.why}\n                    onChange={(e) => setFormData({ ...formData, why: e.target.value })}\n                    placeholder=\"Por que fazer isso?\"\n                    required\n                    rows={2}\n                  />\n                </div>\n                <div>\n                  <Label htmlFor=\"where\">Onde? (Where)</Label>\n                  <Input\n                    id=\"where\"\n                    value={formData.where_location}\n                    onChange={(e) => setFormData({ ...formData, where_location: e.target.value })}\n                    placeholder=\"Onde será implementado?\"\n                    required\n                  />\n                </div>\n                <div>\n                  <Label htmlFor=\"when\">Quando? (When)</Label>\n                  <Input\n                    id=\"when\"\n                    type=\"date\"\n                    value={formData.when_date}\n                    onChange={(e) => setFormData({ ...formData, when_date: e.target.value })}\n                  />\n                </div>\n                <div>\n                  <Label htmlFor=\"who\">Quem? (Who)</Label>\n                  <Input\n                    id=\"who\"\n                    value={formData.who}\n                    onChange={(e) => setFormData({ ...formData, who: e.target.value })}\n                    placeholder=\"Responsável pela execução\"\n                  />\n                </div>\n                <div>\n                  <Label htmlFor=\"priority\">Prioridade</Label>\n                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>\n                    <SelectTrigger id=\"priority\">\n                      <SelectValue />\n                    </SelectTrigger>\n                    <SelectContent>\n                      <SelectItem value=\"baixa\">Baixa</SelectItem>\n                      <SelectItem value=\"media\">Média</SelectItem>\n                      <SelectItem value=\"alta\">Alta</SelectItem>\n                      <SelectItem value=\"critica\">Crítica</SelectItem>\n                    </SelectContent>\n                  </Select>\n                </div>\n                <div className=\"col-span-2\">\n                  <Label htmlFor=\"how\">Como? (How)</Label>\n                  <Textarea\n                    id=\"how\"\n                    value={formData.how}\n                    onChange={(e) => setFormData({ ...formData, how: e.target.value })}\n                    placeholder=\"Como será feito?\"\n                    required\n                    rows={2}\n                  />\n                </div>\n                <div className=\"col-span-2\">\n                  <Label htmlFor=\"cost\">Quanto? (How Much) - Custo estimado</Label>\n                  <Input\n                    id=\"cost\"\n                    type=\"number\"\n                    step=\"0.01\"\n                    value={formData.how_much}\n                    onChange={(e) => setFormData({ ...formData, how_much: e.target.value })}\n                    placeholder=\"Custo estimado em R$\"\n                  />\n                </div>\n              </div>\n              <div className=\"flex gap-2 justify-end\">\n                <Button type=\"button\" variant=\"outline\" onClick={() => setIsOpen(false)}>\n                  Cancelar\n                </Button>\n                <Button type=\"submit\" disabled={isSubmitting}>\n                  {isSubmitting && <Loader2 className=\"w-4 h-4 mr-2 animate-spin\" />}\n                  Criar Plano\n                </Button>\n              </div>\n            </form>\n          </DialogContent>\n        </Dialog>\n      </div>\n\n      {plans.length === 0 ? (\n        <Card>\n          <CardContent className=\"pt-6\">\n            <p className=\"text-center text-muted-foreground\">Nenhum plano de ação criado ainda.</p>\n          </CardContent>\n        </Card>\n      ) : (\n        <div className=\"grid gap-4\">\n          {plans.map((plan) => (\n            <Card key={plan.id}>\n              <CardHeader>\n                <div className=\"flex items-start justify-between\">\n                  <div>\n                    <CardTitle className=\"text-base\">{plan.title}</CardTitle>\n                    {plan.description && (\n                      <CardDescription>{plan.description}</CardDescription>\n                    )}\n                  </div>\n                  <div className=\"flex gap-2\">\n                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[plan.priority]}`}>\n                      {plan.priority}\n                    </span>\n                    <Select value={plan.status} onValueChange={(value) => onUpdateStatus?.(plan.id, value as any)}>\n                      <SelectTrigger className=\"w-32\">\n                        <SelectValue />\n                      </SelectTrigger>\n                      <SelectContent>\n                        <SelectItem value=\"planejado\">Planejado</SelectItem>\n                        <SelectItem value=\"em_progresso\">Em Progresso</SelectItem>\n                        <SelectItem value=\"concluido\">Concluído</SelectItem>\n                        <SelectItem value=\"cancelado\">Cancelado</SelectItem>\n                      </SelectContent>\n                    </Select>\n                  </div>\n                </div>\n              </CardHeader>\n              <CardContent>\n                <div className=\"grid grid-cols-2 gap-4 text-sm\">\n                  <div>\n                    <p className=\"font-semibold text-muted-foreground\">O Quê?</p>\n                    <p className=\"mt-1\">{plan.what}</p>\n                  </div>\n                  <div>\n                    <p className=\"font-semibold text-muted-foreground\">Por Quê?</p>\n                    <p className=\"mt-1\">{plan.why}</p>\n                  </div>\n                  <div>\n                    <p className=\"font-semibold text-muted-foreground\">Onde?</p>\n                    <p className=\"mt-1\">{plan.where_location}</p>\n                  </div>\n                  <div>\n                    <p className=\"font-semibold text-muted-foreground\">Quando?</p>\n                    <p className=\"mt-1\">\n                      {plan.when_date ? new Date(plan.when_date).toLocaleDateString(\"pt-BR\") : \"Não definido\"}\n                    </p>\n                  </div>\n                  <div>\n                    <p className=\"font-semibold text-muted-foreground\">Quem?</p>\n                    <p className=\"mt-1\">{plan.who || \"Não definido\"}</p>\n                  </div>\n                  <div>\n                    <p className=\"font-semibold text-muted-foreground\">Quanto?</p>\n                    <p className=\"mt-1\">\n                      {plan.how_much ? `R$ ${plan.how_much.toFixed(2)}` : \"Não definido\"}\n                    </p>\n                  </div>\n                  <div className=\"col-span-2\">\n                    <p className=\"font-semibold text-muted-foreground\">Como?</p>\n                    <p className=\"mt-1\">{plan.how}</p>\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n          ))}\n        </div>\n      )}\n    </div>\n  );\n}\n
