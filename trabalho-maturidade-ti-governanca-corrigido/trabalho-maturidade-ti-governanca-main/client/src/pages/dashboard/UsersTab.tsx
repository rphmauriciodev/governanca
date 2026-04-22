import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserCog, Shield, Briefcase, User } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  consultor: "Consultor",
  cliente: "Cliente",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  consultor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cliente: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="w-4 h-4" />,
  consultor: <Briefcase className="w-4 h-4" />,
  cliente: <User className="w-4 h-4" />,
};

export default function UsersTab() {
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const usersQuery = trpc.user.list.useQuery();
  const companiesQuery = trpc.company.list.useQuery();
  const updateRoleMutation = trpc.user.updateRole.useMutation();

  const handleEditStart = (userId: number, currentRole: string, currentCompanyId: number | null) => {
    setEditingUserId(userId);
    setSelectedRole(currentRole);
    setSelectedCompanyId(currentCompanyId?.toString() || "");
  };

  const handleSaveRole = async (userId: number) => {
    if (!selectedRole) return;
    try {
      await updateRoleMutation.mutateAsync({
        userId,
        role: selectedRole as "admin" | "consultor" | "cliente",
        companyId: selectedCompanyId ? parseInt(selectedCompanyId) : null,
      });
      toast.success("Perfil do usuário atualizado com sucesso!");
      setEditingUserId(null);
      usersQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-accent" />
            Gerenciamento de Usuários
          </CardTitle>
          <CardDescription>
            Gerencie os perfis de acesso dos usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role Legend */}
          <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg border border-border">
            <span className="text-sm font-medium text-foreground mr-2">Perfis:</span>
            {Object.entries(roleLabels).map(([role, label]) => (
              <span key={role} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${roleColors[role]}`}>
                {roleIcons[role]}
                {label}
              </span>
            ))}
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : usersQuery.data && usersQuery.data.length > 0 ? (
              usersQuery.data.map((user) => (
                <div
                  key={user.id}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground truncate">
                          {user.name || "Sem nome"}
                        </h4>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${roleColors[user.role]}`}>
                          {roleIcons[user.role]}
                          {roleLabels[user.role]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {user.email || "Email não informado"}
                      </p>
                      {user.companyId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Empresa ID: {user.companyId}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Último acesso: {new Date(user.lastSignedIn).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    {editingUserId === user.id ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecione o perfil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="consultor">Consultor</SelectItem>
                            <SelectItem value="cliente">Cliente</SelectItem>
                          </SelectContent>
                        </Select>

                        {selectedRole === "cliente" && (
                          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Vincular empresa" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Sem empresa</SelectItem>
                              {companiesQuery.data?.map((company) => (
                                <SelectItem key={company.id} value={company.id.toString()}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveRole(user.id)}
                            disabled={updateRoleMutation.isPending}
                            className="flex-1 h-8 text-xs"
                          >
                            {updateRoleMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Salvar"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUserId(null)}
                            className="flex-1 h-8 text-xs"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStart(user.id, user.role, user.companyId ?? null)}
                        className="shrink-0"
                      >
                        <UserCog className="w-4 h-4 mr-1" />
                        Editar Perfil
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário cadastrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
