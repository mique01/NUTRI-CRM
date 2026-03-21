import { useEffect, useState } from "react";
import { Chrome } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  clearDeniedAccessMessage,
  getDefaultDeniedAccessMessage,
  getDeniedAccessMessage,
} from "@/services/auth";

const Login = () => {
  const { accessStatus, isConfigured, loginWithGoogle, logout, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState<string | null>(() => getDeniedAccessMessage());

  useEffect(() => {
    setDeniedMessage(getDeniedAccessMessage());
  }, [accessStatus, user]);

  const handleLogin = async () => {
    if (!isConfigured) return;

    clearDeniedAccessMessage();
    setDeniedMessage(null);
    setIsSubmitting(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesion.");
      setIsSubmitting(false);
    }
  };

  const showDeniedState = Boolean(deniedMessage) || (user && accessStatus === "denied");
  const visibleMessage = deniedMessage ?? getDefaultDeniedAccessMessage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-card">
            <span className="text-lg font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bienvenida a NutriCRM</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesion con Google. Si tu cuenta todavia no tiene acceso, le vamos a avisar al
            administrador para que la apruebe.
          </p>
        </div>

        {showDeniedState ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {visibleMessage}
            </div>

            <p className="text-sm text-muted-foreground">
              Cuando el administrador habilite tu cuenta, vas a poder volver a ingresar con Google.
            </p>

            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent"
              >
                Cerrar sesion
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                disabled={isSubmitting || !isConfigured}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-card transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Chrome className="h-4 w-4" />
                {isSubmitting ? "Redirigiendo..." : "Volver a intentar con Google"}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            disabled={isSubmitting || !isConfigured}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-card transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Chrome className="h-4 w-4" />
            {isSubmitting ? "Redirigiendo..." : "Continuar con Google"}
          </button>
        )}

        {!isConfigured ? (
          <div className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Faltan las variables `VITE_SUPABASE_URL` y/o `VITE_SUPABASE_ANON_KEY`.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Login;
