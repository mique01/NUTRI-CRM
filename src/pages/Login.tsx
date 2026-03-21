import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  clearDeniedAccessMessage,
  getDefaultDeniedAccessMessage,
  getDeniedAccessMessage,
} from "@/services/auth";

const Login = () => {
  const { accessStatus, isConfigured, loginWithEmail, logout, user } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState<string | null>(() => getDeniedAccessMessage());

  useEffect(() => {
    setDeniedMessage(getDeniedAccessMessage());
  }, [accessStatus, user]);

  const handleLogin = async () => {
    if (!isConfigured) return;

    clearDeniedAccessMessage();
    setDeniedMessage(null);
    setLinkSent(false);
    setIsSubmitting(true);

    try {
      await loginWithEmail(email);
      setLinkSent(true);
      toast.success("Si el email esta habilitado, te enviamos un enlace para ingresar.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el acceso por email autorizado.",
      );
    } finally {
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
            Ingresa con un email autorizado. Solo pueden entrar las cuentas que hayas invitado
            previamente desde Supabase.
          </p>
        </div>

        {showDeniedState ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {visibleMessage}
            </div>

            <p className="text-sm text-muted-foreground">
              Pedi la invitacion desde Supabase y luego vuelve a ingresar con ese mismo email.
            </p>

            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent"
              >
                Cerrar sesion
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="authorized-email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email autorizado
              </label>
              <input
                id="authorized-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu-email@dominio.com"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40"
              />
            </div>

            {linkSent ? (
              <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
                Revisa tu email. Si la cuenta esta habilitada, vas a recibir un enlace para entrar
                al CRM.
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleLogin}
              disabled={isSubmitting || !isConfigured || !email.trim()}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-card transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              {isSubmitting ? "Enviando enlace..." : "Ingresar con email autorizado"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Una vez dentro del CRM vas a poder conectar Google para integrar Calendar.
            </p>
          </div>
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
