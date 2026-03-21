import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { exchangeCodeForSession, getDeniedAccessMessage } from "@/services/auth";

const AuthCallback = () => {
  const { refreshContext } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const finalizeAuth = async () => {
      try {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const hasCode = url.searchParams.get("code");

        if (hasCode) {
          await exchangeCodeForSession(currentUrl);
        }

        await refreshContext();
        navigate(getDeniedAccessMessage() ? "/login" : "/", { replace: true });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudo completar el ingreso.",
        );
        window.setTimeout(() => navigate("/login", { replace: true }), 1800);
      }
    };

    void finalizeAuth();
  }, [navigate, refreshContext]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-[34px] border border-border/80 bg-[linear-gradient(180deg,rgba(252,249,228,0.97),rgba(244,238,210,0.96))] p-8 text-center shadow-soft">
        <h1 className="font-display text-4xl font-semibold leading-none text-foreground">
          Validando tu acceso
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos confirmando el enlace del email y preparando tu sesion.
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
