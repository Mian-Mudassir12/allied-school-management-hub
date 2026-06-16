import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import { getAuthRole, getAuthUsername, clearAuth } from "@/lib/auth";
import { useLocation } from "wouter";

// Pages
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import LoginPage from "@/pages/login";
import FeesPage from "@/pages/fees";
import AttendancePage from "@/pages/attendance";
import AnnouncementsPage from "@/pages/announcements";
import ParentsPortalPage from "@/pages/parents";
import StudentsPage from "@/pages/students";
import SettingsPage from "@/pages/settings";
import TeachersPage from "@/pages/teachers";
import AcademicPage from "@/pages/academic";
import SubjectsPage from "@/pages/subjects";
import TeacherPortalPage from "@/pages/teacher-portal";

const queryClient = new QueryClient();

// Auth Guard — requires both role AND username (forces re-login on old/incomplete sessions)
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const role = getAuthRole();
  const username = getAuthUsername();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!role || !username) {
      clearAuth();
      setLocation("/login");
      return;
    }
    if (role === "teacher" && !location.startsWith("/teacher-portal")) {
      setLocation("/teacher-portal");
    }
  }, [role, username, location]);

  if (!role || !username) return null;
  if (role === "teacher" && !location.startsWith("/teacher-portal")) return null;
  return <Component />;
}

function RedirectToDashboard() {
  const [_, setLocation] = useLocation();
  const role = getAuthRole();
  const username = getAuthUsername();

  useEffect(() => {
    if (role && username) {
      setLocation("/dashboard");
    } else {
      clearAuth();
      setLocation("/login");
    }
  }, []);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RedirectToDashboard} />
      <Route path="/login" component={LoginPage} />
      <Route path="/parents" component={ParentsPortalPage} />
      <Route path="/teacher-portal/:module">
        <ProtectedRoute component={TeacherPortalPage} />
      </Route>
      <Route path="/teacher-portal">
        <ProtectedRoute component={TeacherPortalPage} />
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/fees">
        <ProtectedRoute component={FeesPage} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={AttendancePage} />
      </Route>
      <Route path="/announcements">
        <ProtectedRoute component={AnnouncementsPage} />
      </Route>
      <Route path="/students">
        <ProtectedRoute component={StudentsPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path="/teachers">
        <ProtectedRoute component={TeachersPage} />
      </Route>
      <Route path="/subjects">
        <ProtectedRoute component={SubjectsPage} />
      </Route>
      <Route path="/academic">
        <ProtectedRoute component={AcademicPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppLayout>
            <Router />
          </AppLayout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
