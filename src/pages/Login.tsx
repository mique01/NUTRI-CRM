import { useState } from "react";
import { Chrome } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const { accessState, accessStatus, isConfigured, loginWithGoogle, logout, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!isConfigured) return;

    setIsSubmitting(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesiÃ³n.");
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
            IniciÃ¡ sesiÃ³n con Google usando un email habilitado previamente desde Supabase.
          </p>
        </div>

        {user && accessStatus === "denied" ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {accessState?.clinicName
                ? `La cuenta ${user.email} no tiene acceso vigente al consultorio ${accessState.clinicName}.`
                : `La cuenta ${user.email} no fue invitada al CRM.`}
            </div>

            <p className="text-sm text-muted-foreground">
              InvitÃ¡ este email desde Supabase y luego volvÃ© a iniciar sesiÃ³n.
            </p>

            <button
              type="button"
              onClick={() => void logout()}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent"
            >
              Cerrar sesiÃ³n
            </button>
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
