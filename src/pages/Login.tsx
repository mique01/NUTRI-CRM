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
  const { accessStatus, isConfigured, loginWithEmail, loginWithGoogle, logout, user } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
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

  const handleGoogleLogin = async () => {
    if (!isConfigured) return;

    clearDeniedAccessMessage();
    setDeniedMessage(null);
    setIsGoogleSubmitting(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo iniciar sesion con Google.",
      );
      setIsGoogleSubmitting(false);
    }
  };

  const showDeniedState = Boolean(deniedMessage) || (user && accessStatus === "denied");
  const visibleMessage = deniedMessage ?? getDefaultDeniedAccessMessage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-[34px] border border-border/80 bg-[linear-gradient(180deg,rgba(252,249,228,0.97),rgba(244,238,210,0.96))] p-8 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-border/70 bg-background/80 text-card">
            <span className="font-display text-2xl font-semibold text-foreground">C</span>
          </div>
          <h1 className="font-display text-4xl font-semibold leading-none text-foreground">
            Bienvenida a Consultorio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa con tu cuenta autorizada. Primero validamos tu usuario y luego te vamos a
            pedir la contraseña compartida del equipo antes de mostrar informacion clinica.
          </p>
        </div>

        {showDeniedState ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {visibleMessage}
            </div>

            <p className="text-sm text-muted-foreground">
              Si la cuenta correcta ya esta autorizada, vuelve a intentar con Google o con el
              email habilitado del equipo.
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
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleSubmitting || !isConfigured}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-base leading-none">G</span>
              {isGoogleSubmitting ? "Redirigiendo a Google..." : "Ingresar con Google"}
            </button>

            <div className="relative py-1 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="bg-[linear-gradient(180deg,rgba(252,249,228,0.97),rgba(244,238,210,0.96))] px-3">
                o con email
              </span>
              <div className="absolute left-0 right-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-border/70" />
            </div>

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
                className="crm-input"
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
              className="flex w-full items-center justify-center gap-3 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              {isSubmitting ? "Enviando enlace..." : "Ingresar con email autorizado"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Google puede usarse para entrar y luego desbloquear el CRM con la contraseña del
              equipo. El acceso por email sigue disponible como respaldo.
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
