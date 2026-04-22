import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, ClipboardList, BarChart3, Sparkles, UserCog } from "lucide-react";
import CompaniesTab from "./dashboard/CompaniesTab";
import QuestionsTab from "./dashboard/QuestionsTab";
import AssessmentsTab from "./dashboard/AssessmentsTab";
import AnalyticsTab from "./dashboard/AnalyticsTab";
import AIQuestionsTab from "./dashboard/AIQuestionsTab";
import UsersTab from "./dashboard/UsersTab";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
    if (!loading && isAuthenticated && user?.role === "cliente") {
      navigate("/client-assessments");
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!isAuthenticated || !user || (user.role !== "admin" && user.role !== "consultor")) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo, {user.name}! Gerencie avaliações, empresas e questões.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assessments" className="w-full">
          <TabsList className={`grid w-full ${user.role === "admin" ? "grid-cols-6" : "grid-cols-3"}`}>
            <TabsTrigger value="assessments" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Avaliações</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Empresas</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Questões</span>
            </TabsTrigger>
            {user.role === "admin" && (
              <>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  <span className="hidden sm:inline">Usuários</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">IA</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="assessments" className="mt-6">
            <AssessmentsTab userRole={user.role} />
          </TabsContent>

          <TabsContent value="companies" className="mt-6">
            <CompaniesTab userRole={user.role} />
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <QuestionsTab userRole={user.role} />
          </TabsContent>

          {user.role === "admin" && (
            <>
              <TabsContent value="users" className="mt-6">
                <UsersTab />
              </TabsContent>
              <TabsContent value="analytics" className="mt-6">
                <AnalyticsTab />
              </TabsContent>
              <TabsContent value="ai" className="mt-6">
                <AIQuestionsTab />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
