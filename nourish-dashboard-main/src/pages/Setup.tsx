import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { consumePendingInviteToken, getPendingInviteToken } from "@/services/auth";
import { acceptClinicInvite, bootstrapClinic } from "@/services/clinic";

const Setup = () => {
  const { user, refreshContext } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clinicName, setClinicName] = useState("");
  const [inviteToken, setInviteToken] = useState(
    searchParams.get("invite") ?? getPendingInviteToken() ?? "",
  );
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [autoInviteHandled, setAutoInviteHandled] = useState(false);

  useEffect(() => {
    if (!inviteToken || autoInviteHandled) return;

    setAutoInviteHandled(true);
    void handleAcceptInvite(inviteToken);
  }, [autoInviteHandled, inviteToken]);

  const handleBootstrap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBootstrapping(true);

    try {
      await bootstrapClinic(clinicName);
      await refreshContext();
      toast.success("Consultorio creado correctamente.");
      navigate("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el consultorio.",
      );
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleAcceptInvite = async (token = inviteToken) => {
    if (!token.trim()) return;

    setIsAcceptingInvite(true);

    try {
      await acceptClinicInvite(token.trim());
      consumePendingInviteToken();
      await refreshContext();
      toast.success("Te uniste al consultorio correctamente.");
      navigate("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo aceptar la invitación.",
      );
    } finally {
      setIsAcceptingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-card">
              <span className="text-lg font-bold">N</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Configurar consultorio</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {user?.email
                ? `Sesión iniciada como ${user.email}.`
                : "Tu sesión ya está lista."}{" "}
              Elegí si vas a crear el espacio principal o unirte mediante invitación.
            </p>
          </div>

          <form onSubmit={handleBootstrap} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Nombre del consultorio
              </label>
              <input
                required
                value={clinicName}
                onChange={(event) => setClinicName(event.target.value)}
                placeholder="Ej. Cami Nutrición"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={isBootstrapping}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBootstrapping ? "Creando..." : "Crear consultorio"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Unirse con invitación</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Si otra nutricionista ya creó el espacio, pegá el token o abrí el link de invitación.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Token de invitación
              </label>
              <input
                value={inviteToken}
                onChange={(event) => setInviteToken(event.target.value)}
                placeholder="Pegá aquí el token recibido"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleAcceptInvite()}
              disabled={!inviteToken.trim() || isAcceptingInvite}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAcceptingInvite ? "Aceptando..." : "Aceptar invitación"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Setup;
