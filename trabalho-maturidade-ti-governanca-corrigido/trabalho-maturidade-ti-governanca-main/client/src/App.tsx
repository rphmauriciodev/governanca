import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import AssessmentPage from "@/pages/AssessmentPage";
import AssessmentResultPage from "@/pages/AssessmentResultPage";
import AssessmentHistoryPage from "@/pages/AssessmentHistoryPage";
import GeneratePDFPage from "@/pages/GeneratePDFPage";
import ClientAssessmentsPage from "@/pages/ClientAssessmentsPage";
import { Route, Switch, useParams } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Wrapper components for routes with parameters
function AssessmentRoute() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return <AssessmentPage assessmentId={parseInt(assessmentId || "0")} />;
}

function AssessmentResultRoute() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return <AssessmentResultPage assessmentId={parseInt(assessmentId || "0")} />;
}

function AssessmentHistoryRoute() {
  const { companyId } = useParams<{ companyId: string }>();
  return <AssessmentHistoryPage companyId={parseInt(companyId || "0")} />;
}

function GeneratePDFRoute() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return <GeneratePDFPage assessmentId={parseInt(assessmentId || "0")} />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/assessment/:assessmentId"} component={AssessmentRoute} />
      <Route path={"/assessment-result/:assessmentId"} component={AssessmentResultRoute} />
      <Route path={"/assessment-history/:companyId"} component={AssessmentHistoryRoute} />
      <Route path={"/generate-pdf/:assessmentId"} component={GeneratePDFRoute} />
      <Route path={"/client-assessments"} component={ClientAssessmentsPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
