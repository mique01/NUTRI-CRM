import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { exchangeCodeForSession } from "@/services/auth";

const AuthCallback = () => {
  const { refreshContext } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const finalizeAuth = async () => {
      try {
        const hasCode = new URL(window.location.href).searchParams.get("code");
        if (!hasCode) {
          navigate("/login", { replace: true });
          return;
        }

        await exchangeCodeForSession(window.location.href);
        await refreshContext();
        navigate("/", { replace: true });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudo completar el login.",
        );
        window.setTimeout(() => navigate("/login", { replace: true }), 1800);
      }
    };

    void finalizeAuth();
  }, [navigate, refreshContext]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-foreground">Conectando tu sesiÃ³n</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos terminando el acceso con Google y validando tu invitaciÃ³n.
        </p>
        {errorMessage ? (
          <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : (
          <div className="mt-6 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
