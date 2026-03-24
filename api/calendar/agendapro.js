import {
  mapCalendarIntegrationSummary,
  requireCalendarRequest,
  upsertCalendarIntegration,
  verifyAgendaProCredentials,
} from "../_lib/calendar-integrations.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { serviceClient, user } = await requireCalendarRequest(req);
    const { username, password, locationId, providerId } = req.body ?? {};

    if (!String(username ?? "").trim() || !String(password ?? "").trim()) {
      return res.status(400).json({
        error: "Completá usuario y contraseña de AgendaPro.",
      });
    }

    await verifyAgendaProCredentials({
      username: String(username).trim(),
      password: String(password),
    });

    const integration = await upsertCalendarIntegration(serviceClient, user.id, {
      provider: "agendapro",
      status: "synced",
      google_refresh_token: null,
      google_access_token: null,
      google_token_expires_at: null,
      google_calendar_id: null,
      agendapro_username: String(username).trim(),
      agendapro_password: String(password),
      agendapro_location_id: String(locationId ?? "").trim() || null,
      agendapro_provider_id: String(providerId ?? "").trim() || null,
      last_synced_at: new Date().toISOString(),
    });

    return res.status(200).json(mapCalendarIntegrationSummary(integration));
  } catch (error) {
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({
      error:
        error instanceof Error
          ? error.message
          : "No pudimos conectar AgendaPro.",
    });
  }
}
