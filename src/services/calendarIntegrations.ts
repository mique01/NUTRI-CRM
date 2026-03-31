import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { listDashboardConsultations } from "@/services/appointments";
import type {
  AgendaProIntegrationFormValues,
  Appointment,
  CalendarIntegrationSummary,
  DashboardConsultation,
} from "@/types/domain";

async function getAccessToken() {
  assertSupabaseConfigured();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Tu sesión ya no es válida. Volvé a ingresar.");
  }

  return session.access_token;
}

async function requestCalendarApi<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "DELETE";
    body?: Record<string, unknown>;
  } = {},
) {
  const accessToken = await getAccessToken();
  const response = await fetch(path, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return null as T;
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error ?? "No pudimos completar la integración de agenda.");
  }

  return payload as T;
}

function mapIntegrationSummary(payload: any): CalendarIntegrationSummary {
  return {
    provider: payload?.provider ?? "local",
    connected: Boolean(payload?.connected),
    status: payload?.status ?? "not_connected",
    googleConnected: Boolean(payload?.googleConnected),
    agendaProConnected: Boolean(payload?.agendaProConnected),
    agendaProUsername: payload?.agendaProUsername ?? null,
    agendaProLocationId: payload?.agendaProLocationId ?? null,
    agendaProProviderId: payload?.agendaProProviderId ?? null,
    lastSyncAt: payload?.lastSyncAt ?? null,
  };
}

function mapDashboardConsultation(payload: any): DashboardConsultation {
  return {
    id: payload.id,
    patientId: payload.patientId ?? null,
    patientName: payload.patientName ?? "Consulta externa",
    startsAt: payload.startsAt,
    endsAt: payload.endsAt ?? null,
    status: payload.status ?? "scheduled",
    sourceProvider: payload.sourceProvider ?? "local",
    eventTitle: payload.eventTitle ?? null,
  };
}

export async function getCalendarIntegrationSummary() {
  const payload = await requestCalendarApi<CalendarIntegrationSummary>("/api/calendar/status");
  return mapIntegrationSummary(payload);
}

export async function connectAgendaPro(
  values: AgendaProIntegrationFormValues,
) {
  const payload = await requestCalendarApi<CalendarIntegrationSummary>("/api/calendar/agendapro", {
    method: "POST",
    body: {
      username: values.username.trim(),
      password: values.password,
      locationId: values.locationId.trim(),
      providerId: values.providerId.trim(),
    },
  });

  return mapIntegrationSummary(payload);
}

export async function startGoogleCalendarIntegration() {
  const payload = await requestCalendarApi<{ url: string }>("/api/calendar/google/start");
  window.location.assign(payload.url);
}

export async function disconnectCalendarIntegration() {
  await requestCalendarApi("/api/calendar/disconnect", {
    method: "DELETE",
  });
}

export async function listExternalDashboardConsultations(monthDate = new Date()) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  const payload = await requestCalendarApi<{ items: DashboardConsultation[] }>(
    `/api/calendar/events?start=${encodeURIComponent(monthStart.toISOString())}&end=${encodeURIComponent(monthEnd.toISOString())}`,
  );

  return Array.isArray(payload?.items)
    ? payload.items.map(mapDashboardConsultation)
    : [];
}

function getExternalAppointmentLabel(consultation: DashboardConsultation) {
  if (consultation.eventTitle?.trim()) {
    return consultation.eventTitle.trim();
  }

  return consultation.sourceProvider === "google_calendar"
    ? "Turno de Google Calendar"
    : "Turno de AgendaPro";
}

function mapExternalConsultationToAppointment(
  patientId: string,
  consultation: DashboardConsultation,
): Appointment {
  return {
    id: `${consultation.sourceProvider}:${consultation.id}`,
    clinicId: "",
    patientId,
    nutritionistProfileId: "",
    startsAt: consultation.startsAt,
    endsAt: consultation.endsAt ?? consultation.startsAt,
    appointmentType: getExternalAppointmentLabel(consultation),
    notes:
      consultation.sourceProvider === "google_calendar"
        ? "Turno sincronizado desde Google Calendar."
        : "Turno sincronizado desde AgendaPro.",
    status: consultation.status,
    externalProvider:
      consultation.sourceProvider === "local" ? null : consultation.sourceProvider,
    externalEventId: consultation.id,
    syncState: consultation.sourceProvider === "local" ? "local_only" : "synced",
  };
}

export async function listExternalPatientAppointments(patientId: string) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 12);

  const payload = await requestCalendarApi<{ items: DashboardConsultation[] }>(
    `/api/calendar/events?start=${encodeURIComponent(startDate.toISOString())}&end=${encodeURIComponent(endDate.toISOString())}&patientId=${encodeURIComponent(patientId)}`,
  );

  return Array.isArray(payload?.items)
    ? payload.items.map(mapDashboardConsultation).map((consultation) =>
        mapExternalConsultationToAppointment(patientId, consultation),
      )
    : [];
}

export async function listDashboardSchedule(
  monthDate = new Date(),
  integrationSummary: CalendarIntegrationSummary | null,
) {
  if (!integrationSummary?.connected || integrationSummary.provider === "local") {
    return listDashboardConsultations(monthDate);
  }

  try {
    return await listExternalDashboardConsultations(monthDate);
  } catch {
    return listDashboardConsultations(monthDate);
  }
}
