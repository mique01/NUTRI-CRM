import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  KeyRound,
  Link2,
  PlugZap,
  Settings2,
  Unplug,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AgendaProIntegrationFormValues,
  CalendarIntegrationSummary,
} from "@/types/domain";

interface CalendarIntegrationPanelProps {
  integrationSummary: CalendarIntegrationSummary | null;
  isConnectingGoogle?: boolean;
  isSavingAgendaPro?: boolean;
  isDisconnecting?: boolean;
  onStartGoogle: () => void;
  onSaveAgendaPro: (values: AgendaProIntegrationFormValues) => void;
  onDisconnect: () => void;
}

const emptyAgendaProValues: AgendaProIntegrationFormValues = {
  username: "",
  password: "",
  locationId: "",
  providerId: "",
};

function getProviderLabel(provider: CalendarIntegrationSummary["provider"]) {
  switch (provider) {
    case "google_calendar":
      return "Google Calendar";
    case "agendapro":
      return "AgendaPro";
    default:
      return "Agenda interna";
  }
}

export default function CalendarIntegrationPanel({
  integrationSummary,
  isConnectingGoogle = false,
  isSavingAgendaPro = false,
  isDisconnecting = false,
  onStartGoogle,
  onSaveAgendaPro,
  onDisconnect,
}: CalendarIntegrationPanelProps) {
  const [agendaProValues, setAgendaProValues] =
    useState<AgendaProIntegrationFormValues>(emptyAgendaProValues);
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false);
  const [agendaDialogOpen, setAgendaDialogOpen] = useState(false);

  useEffect(() => {
    setAgendaProValues((current) => ({
      ...current,
      username: integrationSummary?.agendaProUsername ?? "",
      password: "",
      locationId: integrationSummary?.agendaProLocationId ?? "",
      providerId: integrationSummary?.agendaProProviderId ?? "",
    }));
  }, [integrationSummary]);

  const usingExternalAgenda =
    integrationSummary?.connected && integrationSummary.provider !== "local";

  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://tu-dominio.com";

  const googleRedirectHint = useMemo(() => {
    return `${currentOrigin}/api/calendar/google/callback`;
  }, [currentOrigin]);

  return (
    <>
      <section className="mb-6 flex flex-col gap-3 rounded-[24px] border border-[#6d755f]/45 bg-card/75 px-4 py-4 shadow-soft md:flex-row md:items-center md:justify-between md:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/70">
            Agenda externa
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              <CalendarDays className="h-4 w-4" />
              Fuente activa: {getProviderLabel(integrationSummary?.provider ?? "local")}
            </span>

            {usingExternalAgenda ? (
              <button
                type="button"
                onClick={onDisconnect}
                disabled={isDisconnecting}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Unplug className="h-4 w-4" />
                Usar agenda interna
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGoogleDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/85 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
          >
            <Link2 className="h-4 w-4" />
            Conectar con Google Calendar
          </button>

          <button
            type="button"
            onClick={() => setAgendaDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/85 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
          >
            <Settings2 className="h-4 w-4" />
            Conectar con AgendaPro
          </button>
        </div>
      </section>

      <Dialog open={googleDialogOpen} onOpenChange={setGoogleDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Conectar Google Calendar</DialogTitle>
            <DialogDescription>
              Se va a usar el calendario principal del mismo mail con el que la profesional
              autorice el acceso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
              <p className="font-medium text-foreground">Antes de conectar, revisá esto:</p>
              <p className="mt-2 leading-6">
                En Google Cloud, la app tiene que tener autorizada exactamente esta redirect URI:
              </p>
              <p className="mt-2 rounded-xl bg-card px-3 py-2 font-mono text-[12px] text-foreground">
                {googleRedirectHint}
              </p>
            </div>

            <p className="leading-6">
              Si Google muestra `redirect_uri_mismatch`, normalmente significa que falta esa URL
              en el cliente OAuth o que `APP_BASE_URL` no coincide con el dominio público.
            </p>
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setGoogleDialogOpen(false)}
              className="rounded-full border border-border/80 bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={onStartGoogle}
              disabled={isConnectingGoogle}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Link2 className="h-4 w-4" />
              {integrationSummary?.googleConnected
                ? "Volver a conectar Google"
                : isConnectingGoogle
                  ? "Redirigiendo..."
                  : "Conectar ahora"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={agendaDialogOpen} onOpenChange={setAgendaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conectar AgendaPro</DialogTitle>
            <DialogDescription>
              Usá las credenciales de API pública de AgendaPro. No tiene que ser el login normal
              de la profesional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-[20px] border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
              Si AgendaPro responde `Not authenticated. User invalid.`, casi siempre significa
              que está recibiendo el usuario/contraseña del acceso normal y no las credenciales
              de API pública.
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Usuario AgendaPro
                </label>
                <input
                  value={agendaProValues.username}
                  onChange={(event) =>
                    setAgendaProValues((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  placeholder="Usuario de API pública"
                  className="crm-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Contraseña AgendaPro
                </label>
                <input
                  type="password"
                  value={agendaProValues.password}
                  onChange={(event) =>
                    setAgendaProValues((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Contraseña de API pública"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Local ID
                </label>
                <input
                  value={agendaProValues.locationId}
                  onChange={(event) =>
                    setAgendaProValues((current) => ({
                      ...current,
                      locationId: event.target.value,
                    }))
                  }
                  placeholder="Opcional"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Prestador ID
                </label>
                <input
                  value={agendaProValues.providerId}
                  onChange={(event) =>
                    setAgendaProValues((current) => ({
                      ...current,
                      providerId: event.target.value,
                    }))
                  }
                  placeholder="Opcional"
                  className="crm-input"
                />
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setAgendaDialogOpen(false)}
              className="rounded-full border border-border/80 bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => onSaveAgendaPro(agendaProValues)}
              disabled={
                isSavingAgendaPro ||
                !agendaProValues.username.trim() ||
                !agendaProValues.password.trim()
              }
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              {isSavingAgendaPro ? "Conectando..." : "Guardar AgendaPro"}
            </button>

            {usingExternalAgenda ? (
              <button
                type="button"
                onClick={onDisconnect}
                disabled={isDisconnecting}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlugZap className="h-4 w-4" />
                Volver a agenda interna
              </button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
