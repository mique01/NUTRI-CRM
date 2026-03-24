import {
  buildGoogleAuthUrl,
  requireCalendarRequest,
} from "../../_lib/calendar-integrations.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { user } = await requireCalendarRequest(req);
    return res.status(200).json({
      url: buildGoogleAuthUrl(req, user.id),
    });
  } catch (error) {
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({
      error:
        error instanceof Error
          ? error.message
          : "No pudimos iniciar la conexión con Google Calendar.",
    });
  }
}
