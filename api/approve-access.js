import {
  createServiceRoleClient,
  ensureMembership,
  normalizeEmail,
  renderApprovalPage,
} from "./_lib/access-request.js";

function sendHtml(res, status, html) {
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendHtml(
      res,
      405,
      renderApprovalPage({
        title: "Metodo no permitido",
        message: "Este enlace solo se puede abrir desde el mail de aprobacion.",
        tone: "error",
      }),
    );
    return;
  }

  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";

    if (!token) {
      sendHtml(
        res,
        400,
        renderApprovalPage({
          title: "Solicitud invalida",
          message: "El enlace de aprobacion no incluye un token valido.",
          tone: "error",
        }),
      );
      return;
    }

    const serviceClient = createServiceRoleClient();
    const { data: requestRecord, error } = await serviceClient
      .from("access_requests")
      .select("*")
      .eq("approval_token", token)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!requestRecord) {
      sendHtml(
        res,
        404,
        renderApprovalPage({
          title: "Solicitud no encontrada",
          message: "No pudimos encontrar una solicitud pendiente para este enlace.",
          tone: "error",
        }),
      );
      return;
    }

    if (requestRecord.status === "approved") {
      sendHtml(
        res,
        200,
        renderApprovalPage({
          title: "Acceso ya aprobado",
          message: `La cuenta ${requestRecord.email} ya habia sido habilitada.`,
          tone: "success",
        }),
      );
      return;
    }

    if (!requestRecord.profile_id || !requestRecord.clinic_id) {
      sendHtml(
        res,
        400,
        renderApprovalPage({
          title: "Solicitud incompleta",
          message: "La solicitud no tiene los datos necesarios para crear la membresia.",
          tone: "error",
        }),
      );
      return;
    }

    const adminEmail = normalizeEmail(process.env.ACCESS_REQUEST_ADMIN_EMAIL);
    const role = normalizeEmail(requestRecord.email) === adminEmail ? "admin" : "nutritionist";

    await ensureMembership(serviceClient, {
      clinicId: requestRecord.clinic_id,
      profileId: requestRecord.profile_id,
      role,
    });

    const { error: updateError } = await serviceClient
      .from("access_requests")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by_email: adminEmail || "admin",
      })
      .eq("id", requestRecord.id);

    if (updateError) {
      throw updateError;
    }

    sendHtml(
      res,
      200,
      renderApprovalPage({
        title: "Acceso aprobado",
        message: `La cuenta ${requestRecord.email} ya quedo habilitada para ingresar al CRM.`,
        tone: "success",
      }),
    );
  } catch (error) {
    console.error("approve-access failed", error);
    sendHtml(
      res,
      500,
      renderApprovalPage({
        title: "No pudimos aprobar el acceso",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrio un error inesperado al habilitar la cuenta.",
        tone: "error",
      }),
    );
  }
}
