import {
  getCalendarIntegration,
  listClinicPatients,
  listAgendaProEvents,
  listGoogleCalendarEvents,
  matchCalendarItemsToPatients,
  requireCalendarRequest,
  upsertCalendarIntegration,
} from "../_lib/calendar-integrations.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { serviceClient, user, membership } = await requireCalendarRequest(req);
    const startIso = String(req.query.start ?? "");
    const endIso = String(req.query.end ?? "");
    const patientId = String(req.query.patientId ?? "").trim();

    if (!startIso || !endIso) {
      return res.status(400).json({
        error: "Faltan las fechas para consultar la agenda.",
      });
    }

    const integration = await getCalendarIntegration(serviceClient, user.id);

    if (!integration?.provider || integration.status !== "synced") {
      return res.status(200).json({ items: [] });
    }

    const rawItems =
      integration.provider === "google_calendar"
        ? await listGoogleCalendarEvents(serviceClient, integration, {
            startIso,
            endIso,
          })
        : await listAgendaProEvents(integration, {
            startIso,
            endIso,
          });
    const patients = await listClinicPatients(serviceClient, membership.clinic_id);
    const items = matchCalendarItemsToPatients(rawItems, patients).filter((item) =>
      patientId ? item.patientId === patientId : true,
    );

    await upsertCalendarIntegration(serviceClient, user.id, {
      provider: integration.provider,
      status: "synced",
      google_refresh_token: integration.google_refresh_token,
      google_access_token: integration.google_access_token,
      google_token_expires_at: integration.google_token_expires_at,
      google_calendar_id: integration.google_calendar_id,
      agendapro_username: integration.agendapro_username,
      agendapro_password: integration.agendapro_password,
      agendapro_location_id: integration.agendapro_location_id,
      agendapro_provider_id: integration.agendapro_provider_id,
      last_synced_at: new Date().toISOString(),
    });

    return res.status(200).json({ items });
  } catch (error) {
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({
      error:
        error instanceof Error
          ? error.message
          : "No pudimos traer la agenda externa.",
    });
  }
}
