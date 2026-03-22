import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Unlock = () => {
  const { clinic, unlockWithSharedPassword, logout, user } = useAuth();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnlock = async () => {
    if (!password.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await unlockWithSharedPassword(password);
      toast.success("Acceso habilitado correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos validar la contraseña secundaria.",
      );
    } finally {
      setIsSubmitting(false);
      setPassword("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-[34px] border border-border/80 bg-[linear-gradient(180deg,rgba(252,249,228,0.97),rgba(244,238,210,0.96))] p-8 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-border/70 bg-background/80 text-card">
            <LockKeyhole className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="font-display text-4xl font-semibold leading-none text-foreground">
            Desbloquear informacion
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clinic?.name
              ? `Ingresaste como ${user?.email ?? "tu cuenta"} en ${clinic.name}.`
              : `Ingresaste como ${user?.email ?? "tu cuenta"}.`}{" "}
            Para ver historias clinicas y pacientes, ingresa la contraseña compartida del equipo.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="shared-access-password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Contraseña secundaria
            </label>
            <input
              id="shared-access-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa la contraseña del equipo"
              className="crm-input"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleUnlock();
                }
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleUnlock()}
            disabled={isSubmitting || !password.trim()}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LockKeyhole className="h-4 w-4" />
            {isSubmitting ? "Validando..." : "Ver informacion del CRM"}
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unlock;
