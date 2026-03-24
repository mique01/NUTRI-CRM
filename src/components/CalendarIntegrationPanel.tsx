import { useEffect, useState } from "react";
import { CalendarDays, KeyRound, Link2, PlugZap, Unplug } from "lucide-react";
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

  return (
    <section className="mb-6 rounded-[30px] border border-[#6d755f]/55 bg-[linear-gradient(180deg,rgba(251,247,222,0.92),rgba(242,238,212,0.96))] p-5 shadow-[0_14px_30px_rgba(91,88,66,0.12)] md:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/70">
            Integración de agenda
          </p>
          <h2 className="mt-2 font-display text-[2rem] font-semibold tracking-tight text-foreground">
            Elegí tu fuente de calendario
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cada profesional puede trabajar con su propia agenda. Google usa el
            calendario primario del mismo mail autenticado, y AgendaPro se conecta
            con credenciales seguras desde el backend.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <CalendarDays className="h-4 w-4" />
          Fuente activa: {getProviderLabel(integrationSummary?.provider ?? "local")}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className="rounded-[24px] border border-border/70 bg-background/70 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                Google Calendar
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">
                Integrar con Google
              </h3>
            </div>

            {integrationSummary?.googleConnected ? (
              <span className="rounded-full border border-success/25 bg-success/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-success">
                Conectado
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Ideal para la profesional que ya trabaja con Google. El panel va a leer
            los eventos del calendario principal del correo que autorice el acceso.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
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
                  : "Integrar Google Calendar"}
            </button>

            {usingExternalAgenda ? (
              <button
                type="button"
                onClick={onDisconnect}
                disabled={isDisconnecting}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Unplug className="h-4 w-4" />
                Usar agenda interna
              </button>
            ) : null}
          </div>
        </article>

        <article className="rounded-[24px] border border-border/70 bg-background/70 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                AgendaPro
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">
                Conectar con credenciales
              </h3>
            </div>

            {integrationSummary?.agendaProConnected ? (
              <span className="rounded-full border border-success/25 bg-success/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-success">
                Conectado
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Si usan AgendaPro, podés guardar usuario y contraseña de la API pública.
            El `Local ID` y `Prestador ID` son opcionales, pero ayudan a filtrar solo
            la agenda de esa profesional.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
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
                placeholder="Tu usuario de API pública"
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
                placeholder="Volvé a ingresarla para validar la conexión"
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

          <div className="mt-5 flex flex-wrap gap-3">
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
        </article>
      </div>
    </section>
  );
}
