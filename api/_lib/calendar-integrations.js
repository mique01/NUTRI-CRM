import crypto from "node:crypto";
import {
  createServiceRoleClient,
  getAuthenticatedUser,
  getBaseUrl,
  getMembership,
} from "./access-request.js";

const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw Object.assign(new Error(`Missing environment variable: ${name}`), {
      statusCode: 500,
    });
  }

  return value;
}

export function getGoogleConfig(req) {
  return {
    clientId: requireEnv("GOOGLE_CALENDAR_CLIENT_ID"),
    clientSecret: requireEnv("GOOGLE_CALENDAR_CLIENT_SECRET"),
    redirectUri: `${getBaseUrl(req)}/api/calendar/google/callback`,
  };
}

function getStateSecret() {
  return (
    process.env.GOOGLE_CALENDAR_STATE_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "calendar-state-secret"
  );
}

function signStatePayload(encodedPayload) {
  return crypto
    .createHmac("sha256", getStateSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createGoogleState(profileId) {
  const payload = Buffer.from(
    JSON.stringify({
      profileId,
      exp: Date.now() + 10 * 60_000,
    }),
  ).toString("base64url");

  return `${payload}.${signStatePayload(payload)}`;
}

export function parseGoogleState(state) {
  const [payload, signature] = (state ?? "").split(".");

  if (!payload || !signature) {
    throw Object.assign(new Error("El estado de la integración no es válido."), {
      statusCode: 400,
    });
  }

  const expectedSignature = signStatePayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw Object.assign(new Error("No pudimos validar la solicitud de Google Calendar."), {
      statusCode: 400,
    });
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

  if (!parsed?.profileId || !parsed?.exp || Date.now() > parsed.exp) {
    throw Object.assign(new Error("La solicitud de integración ya expiró. Volvé a intentarlo."), {
      statusCode: 400,
    });
  }

  return parsed;
}

export async function requireCalendarRequest(req) {
  const serviceClient = createServiceRoleClient();
  const user = await getAuthenticatedUser(req);
  const membership = await getMembership(serviceClient, user.id);

  if (!membership?.clinic_id) {
    throw Object.assign(new Error("Tu usuario todavía no tiene acceso al consultorio."), {
      statusCode: 403,
    });
  }

  return { serviceClient, user, membership };
}

export async function getCalendarIntegration(serviceClient, profileId) {
  const { data, error } = await serviceClient
    .from("professional_calendar_integrations")
    .select(
      "id, profile_id, provider, status, google_refresh_token, google_access_token, google_token_expires_at, google_calendar_id, agendapro_username, agendapro_password, agendapro_location_id, agendapro_provider_id, last_synced_at, created_at, updated_at",
    )
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export function mapCalendarIntegrationSummary(row) {
  return {
    provider: row?.provider ?? "local",
    connected: Boolean(row?.provider && row?.status === "synced"),
    status: row?.status ?? "not_connected",
    googleConnected:
      row?.provider === "google_calendar" && row?.status === "synced",
    agendaProConnected: row?.provider === "agendapro" && row?.status === "synced",
    agendaProUsername: row?.agendapro_username ?? null,
    agendaProLocationId: row?.agendapro_location_id ?? null,
    agendaProProviderId: row?.agendapro_provider_id ?? null,
    lastSyncAt: row?.last_synced_at ?? null,
  };
}

export async function upsertCalendarIntegration(
  serviceClient,
  profileId,
  values,
) {
  const { data, error } = await serviceClient
    .from("professional_calendar_integrations")
    .upsert(
      {
        profile_id: profileId,
        ...values,
      },
      {
        onConflict: "profile_id",
      },
    )
    .select(
      "id, profile_id, provider, status, google_refresh_token, google_access_token, google_token_expires_at, google_calendar_id, agendapro_username, agendapro_password, agendapro_location_id, agendapro_provider_id, last_synced_at, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteCalendarIntegration(serviceClient, profileId) {
  const { error } = await serviceClient
    .from("professional_calendar_integrations")
    .delete()
    .eq("profile_id", profileId);

  if (error) {
    throw error;
  }
}

function buildAgendaProAuthHeader(username, password) {
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${credentials}`;
}

async function safeReadJson(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

export async function verifyAgendaProCredentials({
  username,
  password,
}) {
  const response = await fetch("https://agendapro.com/api/public/v1/locations", {
    method: "GET",
    headers: {
      Authorization: buildAgendaProAuthHeader(username, password),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const payload = await safeReadJson(response);
    throw Object.assign(
      new Error(
        payload?.message ??
          payload?.error ??
          "Las credenciales de AgendaPro no pudieron validarse.",
      ),
      {
        statusCode: response.status,
      },
    );
  }

  return safeReadJson(response);
}

export function buildGoogleAuthUrl(req, profileId) {
  const { clientId, redirectUri } = getGoogleConfig(req);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", createGoogleState(profileId));
  return url.toString();
}

export async function exchangeGoogleCode(req, code) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig(req);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const payload = await safeReadJson(response);

  if (!response.ok) {
    throw Object.assign(
      new Error(
        payload?.error_description ??
          payload?.error ??
          "No pudimos conectar Google Calendar.",
      ),
      {
        statusCode: response.status,
      },
    );
  }

  return payload;
}

export async function refreshGoogleToken(refreshToken) {
  const clientId = requireEnv("GOOGLE_CALENDAR_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CALENDAR_CLIENT_SECRET");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const payload = await safeReadJson(response);

  if (!response.ok) {
    throw Object.assign(
      new Error(
        payload?.error_description ??
          payload?.error ??
          "No pudimos renovar el acceso a Google Calendar.",
      ),
      {
        statusCode: response.status,
      },
    );
  }

  return payload;
}

function resolveIsoDate(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const normalized = new Date(value);

    if (!Number.isNaN(normalized.getTime())) {
      return normalized.toISOString();
    }
  }

  return null;
}

function normalizeExternalStatus(value) {
  const normalized = String(value ?? "").toLowerCase();

  if (
    normalized.includes("cancel") ||
    normalized.includes("rejected") ||
    normalized.includes("deleted")
  ) {
    return "cancelled";
  }

  if (
    normalized.includes("complete") ||
    normalized.includes("done") ||
    normalized.includes("final") ||
    normalized.includes("attended")
  ) {
    return "completed";
  }

  if (
    normalized.includes("no_show") ||
    normalized.includes("noshow") ||
    normalized.includes("absent") ||
    normalized.includes("ausente")
  ) {
    return "no_show";
  }

  return "scheduled";
}

function getValueByPath(row, path) {
  return path.split(".").reduce((current, key) => current?.[key], row);
}

function getFirstValue(row, paths) {
  for (const path of paths) {
    const value = getValueByPath(row, path);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function mapGoogleEvent(event) {
  const startsAt = resolveIsoDate(event?.start?.dateTime ?? event?.start?.date);

  if (!startsAt) {
    return null;
  }

  return {
    id: event.id ?? startsAt,
    patientId: null,
    patientName: event.summary?.trim() || "Evento de Google Calendar",
    startsAt,
    endsAt: resolveIsoDate(event?.end?.dateTime ?? event?.end?.date),
    status: normalizeExternalStatus(event.status),
    sourceProvider: "google_calendar",
  };
}

function mapAgendaProBooking(booking) {
  const startsAt = resolveIsoDate(
    getFirstValue(booking, [
      "starts_at",
      "start_at",
      "start",
      "booking_start",
      "start_time",
      "date",
    ]),
  );

  if (!startsAt) {
    return null;
  }

  const clientFirstName = getFirstValue(booking, ["client.first_name", "customer.first_name"]);
  const clientLastName = getFirstValue(booking, ["client.last_name", "customer.last_name"]);
  const clientName = `${clientFirstName ?? ""} ${clientLastName ?? ""}`.trim();

  return {
    id: String(getFirstValue(booking, ["id", "uuid"]) ?? startsAt),
    patientId: null,
    patientName:
      clientName ||
      getFirstValue(booking, [
        "client_name",
        "customer_name",
        "title",
        "service_name",
        "service.name",
      ]) ||
      "Reserva AgendaPro",
    startsAt,
    endsAt: resolveIsoDate(
      getFirstValue(booking, [
        "ends_at",
        "end_at",
        "end",
        "booking_end",
        "end_time",
      ]),
    ),
    status: normalizeExternalStatus(
      getFirstValue(booking, ["status", "booking_status", "state"]),
    ),
    sourceProvider: "agendapro",
    locationId: getFirstValue(booking, ["location_id", "location.id"]),
    providerId: getFirstValue(booking, [
      "provider_id",
      "professional_id",
      "employee_id",
      "seller_id",
      "provider.id",
      "professional.id",
      "employee.id",
    ]),
  };
}

function filterByDateRange(items, startIso, endIso) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  return items.filter((item) => {
    const startsAt = new Date(item.startsAt).getTime();
    return startsAt >= start && startsAt < end;
  });
}

export async function listGoogleCalendarEvents(
  serviceClient,
  integration,
  { startIso, endIso },
) {
  let accessToken = integration.google_access_token;
  const expiresAt = integration.google_token_expires_at
    ? new Date(integration.google_token_expires_at).getTime()
    : 0;
  const shouldRefresh = !accessToken || !expiresAt || expiresAt <= Date.now() + 60_000;

  if (shouldRefresh) {
    const refreshed = await refreshGoogleToken(integration.google_refresh_token);
    accessToken = refreshed.access_token;

    integration = await upsertCalendarIntegration(serviceClient, integration.profile_id, {
      provider: "google_calendar",
      status: "synced",
      google_refresh_token:
        refreshed.refresh_token ?? integration.google_refresh_token,
      google_access_token: refreshed.access_token,
      google_token_expires_at: new Date(
        Date.now() + Number(refreshed.expires_in ?? 3600) * 1000,
      ).toISOString(),
      google_calendar_id: integration.google_calendar_id ?? "primary",
      agendapro_username: null,
      agendapro_password: null,
      agendapro_location_id: null,
      agendapro_provider_id: null,
      last_synced_at: new Date().toISOString(),
    });
  }

  const calendarId = integration.google_calendar_id ?? "primary";
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
  );
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeMin", startIso);
  url.searchParams.set("timeMax", endIso);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const payload = await safeReadJson(response);

  if (!response.ok) {
    throw Object.assign(
      new Error(payload?.error?.message ?? "No pudimos leer Google Calendar."),
      {
        statusCode: response.status,
      },
    );
  }

  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.map(mapGoogleEvent).filter(Boolean);
}

export async function listAgendaProEvents(integration, { startIso, endIso }) {
  const attempts = [
    {
      starts_at: startIso,
      ends_at: endIso,
    },
    {
      from: startIso,
      to: endIso,
    },
    {
      start_date: startIso.slice(0, 10),
      end_date: endIso.slice(0, 10),
    },
    null,
  ];

  let payload = null;
  let lastError = null;

  for (const params of attempts) {
    const url = new URL("https://agendapro.com/api/public/v1/bookings");

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url, {
      headers: {
        Authorization: buildAgendaProAuthHeader(
          integration.agendapro_username,
          integration.agendapro_password,
        ),
        Accept: "application/json",
      },
    });

    const currentPayload = await safeReadJson(response);

    if (response.ok) {
      payload = currentPayload;
      break;
    }

    lastError = currentPayload;
  }

  if (!payload) {
    throw Object.assign(
      new Error(
        lastError?.message ??
          lastError?.error ??
          "No pudimos leer las reservas de AgendaPro.",
      ),
      {
        statusCode: 502,
      },
    );
  }

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.bookings)
        ? payload.bookings
        : [];

  const mapped = items.map(mapAgendaProBooking).filter(Boolean);

  return filterByDateRange(
    mapped.filter((item) => {
      const locationMatches =
        !integration.agendapro_location_id ||
        String(item.locationId ?? "") === String(integration.agendapro_location_id);
      const providerMatches =
        !integration.agendapro_provider_id ||
        String(item.providerId ?? "") === String(integration.agendapro_provider_id);

      return locationMatches && providerMatches;
    }),
    startIso,
    endIso,
  ).map(({ locationId, providerId, ...item }) => item);
}
