import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Chrome } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getPendingInviteToken } from "@/services/auth";

const Login = () => {
  const { isConfigured, loginWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingInviteToken = useMemo(
    () => searchParams.get("invite") ?? getPendingInviteToken(),
    [searchParams],
  );

  const handleLogin = async () => {
    if (!isConfigured) return;

    setIsSubmitting(true);

    try {
      await loginWithGoogle(pendingInviteToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-card">
            <span className="text-lg font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bienvenida a NutriCRM</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Iniciá sesión con Google para acceder al consultorio compartido.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={isSubmitting || !isConfigured}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-card transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Chrome className="h-4 w-4" />
          {isSubmitting ? "Redirigiendo..." : "Continuar con Google"}
        </button>

        {pendingInviteToken ? (
          <p className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-center text-xs text-primary">
            Detectamos una invitación pendiente. Después del login se intentará unir tu cuenta al consultorio.
          </p>
        ) : null}

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
