import {
  deleteCalendarIntegration,
  requireCalendarRequest,
} from "../_lib/calendar-integrations.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { serviceClient, user } = await requireCalendarRequest(req);
    await deleteCalendarIntegration(serviceClient, user.id);
    return res.status(204).end();
  } catch (error) {
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({
      error:
        error instanceof Error
          ? error.message
          : "No pudimos desconectar la agenda externa.",
    });
  }
}
