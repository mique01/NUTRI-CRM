import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateProfessionalProfile } from "@/services/consultations";

const Unlock = () => {
  const { clinic, currentProfessionalProfile, unlockWithSharedPassword, logout, user } =
    useAuth();
  const [password, setPassword] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setProfessionalTitle(currentProfessionalProfile?.professionalTitle ?? "");
    setSpecialty(currentProfessionalProfile?.specialty ?? "");
  }, [currentProfessionalProfile]);

  const profileIsComplete = Boolean(professionalTitle.trim() && specialty.trim());

  const handleUnlock = async () => {
    if (!password.trim() || !profileIsComplete || !user?.id) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfessionalProfile(user.id, {
        professionalTitle,
        specialty,
      });
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
            Completar ingreso
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clinic?.name
              ? `Ingresaste como ${user?.email ?? "tu cuenta"} en ${clinic.name}.`
              : `Ingresaste como ${user?.email ?? "tu cuenta"}.`}{" "}
            Completa tu firma profesional y luego ingresa la contraseña compartida del equipo.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-border/70 bg-background/55 p-4">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Firma profesional
            </p>

            <div className="grid gap-3">
              <div>
                <label
                  htmlFor="professional-title"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Nombre para firma
                </label>
                <input
                  id="professional-title"
                  value={professionalTitle}
                  onChange={(event) => setProfessionalTitle(event.target.value)}
                  placeholder="Ej. Lic. De Torres Curth"
                  className="crm-input"
                />
              </div>

              <div>
                <label
                  htmlFor="professional-specialty"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Especialidad
                </label>
                <input
                  id="professional-specialty"
                  value={specialty}
                  onChange={(event) => setSpecialty(event.target.value)}
                  placeholder="Ej. Nutricion clinica"
                  className="crm-input"
                />
              </div>
            </div>
          </div>

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
            disabled={isSubmitting || !password.trim() || !profileIsComplete}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LockKeyhole className="h-4 w-4" />
            {isSubmitting ? "Validando..." : "Entrar al CRM"}
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
