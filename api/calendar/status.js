import {
  getCalendarIntegration,
  mapCalendarIntegrationSummary,
  requireCalendarRequest,
} from "../_lib/calendar-integrations.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { serviceClient, user } = await requireCalendarRequest(req);
    const integration = await getCalendarIntegration(serviceClient, user.id);
    return res.status(200).json(mapCalendarIntegrationSummary(integration));
  } catch (error) {
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({
      error:
        error instanceof Error
          ? error.message
          : "No pudimos revisar la integración de agenda.",
    });
  }
}
