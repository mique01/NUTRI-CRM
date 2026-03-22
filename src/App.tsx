import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthCallback from "@/pages/AuthCallback";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import PatientDetail from "@/pages/PatientDetail";
import Patients from "@/pages/Patients";
import Setup from "@/pages/Setup";
import Unlock from "@/pages/Unlock";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const FullscreenMessage = ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-card">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const {
    user,
    clinic,
    accessStatus,
    loading,
    isConfigured,
    sharedAccessRequired,
    sharedAccessUnlocked,
  } = useAuth();

  if (loading) {
    return (
      <FullscreenMessage
        title="Cargando CRM"
        body="Estamos validando la sesión y preparando tus datos."
      />
    );
  }

  if (!isConfigured) {
    return (
      <FullscreenMessage
        title="Falta configurar Supabase"
        body="Definí VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para usar la app."
      />
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (sharedAccessRequired && !sharedAccessUnlocked) return <Navigate to="/unlock" replace />;
  if (accessStatus === "pending_bootstrap") return <Navigate to="/setup" replace />;
  if (!clinic || accessStatus === "denied") return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const GuestRoute = ({ children }: { children: ReactNode }) => {
  const { user, clinic, accessStatus, loading, sharedAccessRequired, sharedAccessUnlocked } =
    useAuth();

  if (loading) {
    return (
      <FullscreenMessage
        title="Preparando acceso"
        body="Un segundo, estamos revisando si ya hay una sesión activa."
      />
    );
  }

  if (user && sharedAccessRequired && !sharedAccessUnlocked) {
    return <Navigate to="/unlock" replace />;
  }

  if (user && clinic && accessStatus === "member") {
    return (
      <Navigate
        to={sharedAccessRequired && !sharedAccessUnlocked ? "/unlock" : "/"}
        replace
      />
    );
  }
  if (user && accessStatus === "pending_bootstrap") return <Navigate to="/setup" replace />;
  return <>{children}</>;
};

const SetupRoute = () => {
  const { user, clinic, accessStatus, loading, sharedAccessRequired, sharedAccessUnlocked } =
    useAuth();

  if (loading) {
    return (
      <FullscreenMessage
        title="Cargando configuración"
        body="Estamos revisando tu acceso al consultorio."
      />
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (sharedAccessRequired && !sharedAccessUnlocked) return <Navigate to="/unlock" replace />;
  if (clinic && accessStatus === "member") return <Navigate to="/" replace />;
  if (accessStatus === "denied") return <Navigate to="/login" replace />;
  return <Setup />;
};

const UnlockRoute = () => {
  const { user, clinic, accessStatus, loading, sharedAccessRequired, sharedAccessUnlocked } =
    useAuth();

  if (loading) {
    return (
      <FullscreenMessage
        title="Validando acceso"
        body="Estamos comprobando la sesiÃ³n y el desbloqueo del CRM."
      />
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!sharedAccessRequired && accessStatus === "pending_bootstrap") {
    return <Navigate to="/setup" replace />;
  }
  if (!sharedAccessRequired && (!clinic || accessStatus === "denied")) {
    return <Navigate to="/login" replace />;
  }
  if (!sharedAccessRequired || sharedAccessUnlocked) return <Navigate to="/" replace />;
  return <Unlock />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/setup" element={<SetupRoute />} />
      <Route path="/unlock" element={<UnlockRoute />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Patients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute>
            <PatientDetail />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
