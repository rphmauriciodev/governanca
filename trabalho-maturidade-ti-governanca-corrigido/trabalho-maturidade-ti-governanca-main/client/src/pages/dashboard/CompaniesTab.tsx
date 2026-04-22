import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CompanyForm from "@/components/CompanyForm";

interface CompaniesTabProps {
  userRole: string;
}

export default function CompaniesTab({ userRole }: CompaniesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const companiesQuery = trpc.company.list.useQuery();

  const handleFormSuccess = () => {
    companiesQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Empresas Clientes</CardTitle>
          <CardDescription>Gerencie as empresas cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userRole === "admin" && (
            <>
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa
              </Button>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl">
                  <CompanyForm onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} />
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Companies List */}
          <div className="mt-6 space-y-3">
            {companiesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : companiesQuery.data && companiesQuery.data.length > 0 ? (
              companiesQuery.data.map((company) => (
                <div
                  key={company.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-all duration-300 ease-in-out cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{company.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                      {company.industry && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Setor: {company.industry} | Tamanho: {company.size}
                        </p>
                      )}
                    </div>
                    <span className="badge-primary">{company.size}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma empresa cadastrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
