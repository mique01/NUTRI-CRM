import {
  exchangeGoogleCode,
  getCalendarIntegration,
  parseGoogleState,
  upsertCalendarIntegration,
} from "../../_lib/calendar-integrations.js";
import {
  createServiceRoleClient,
  getBaseUrl,
  getMembership,
} from "../../_lib/access-request.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed.");
  }

  const baseUrl = getBaseUrl(req);

  try {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");

    if (!code || !state) {
      throw Object.assign(new Error("Google no devolvió el código de autorización."), {
        statusCode: 400,
      });
    }

    const { profileId } = parseGoogleState(state);
    const serviceClient = createServiceRoleClient();
    const membership = await getMembership(serviceClient, profileId);

    if (!membership?.clinic_id) {
      throw Object.assign(new Error("La profesional ya no tiene acceso al consultorio."), {
        statusCode: 403,
      });
    }

    const existing = await getCalendarIntegration(serviceClient, profileId);
    const tokens = await exchangeGoogleCode(req, code);

    await upsertCalendarIntegration(serviceClient, profileId, {
      provider: "google_calendar",
      status: "synced",
      google_refresh_token:
        tokens.refresh_token ?? existing?.google_refresh_token ?? null,
      google_access_token: tokens.access_token ?? null,
      google_token_expires_at: tokens.expires_in
        ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString()
        : existing?.google_token_expires_at ?? null,
      google_calendar_id: existing?.google_calendar_id ?? "primary",
      agendapro_username: null,
      agendapro_password: null,
      agendapro_location_id: null,
      agendapro_provider_id: null,
      last_synced_at: new Date().toISOString(),
    });

    return res.redirect(`${baseUrl}/?calendar=google-connected`);
  } catch (error) {
    const message = encodeURIComponent(
      error instanceof Error
        ? error.message
        : "No pudimos completar la conexión con Google Calendar.",
    );

    return res.redirect(`${baseUrl}/?calendar=google-error&message=${message}`);
  }
}
