import {
  createServiceRoleClient,
  ensureMembership,
  getAuthenticatedUser,
  getBaseUrl,
  getMembership,
  getProfileEmail,
  getPrimaryClinic,
  normalizeEmail,
  sendAdminAccessEmail,
} from "./_lib/access-request.js";

function json(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const user = await getAuthenticatedUser(req);
    const normalizedEmail = normalizeEmail(user.email);

    if (!normalizedEmail) {
      json(res, 400, { error: "No encontramos un email valido en tu cuenta." });
      return;
    }

    const serviceClient = createServiceRoleClient();
    const membership = await getMembership(serviceClient, user.id);

    if (membership) {
      json(res, 200, {
        status: "member",
        message: "Tu cuenta ya tiene acceso al CRM.",
      });
      return;
    }

    const clinic = await getPrimaryClinic(serviceClient);

    if (!clinic) {
      json(res, 200, {
        status: "pending_bootstrap",
        message: "Todavia no hay un consultorio configurado.",
      });
      return;
    }

    let adminEmail = normalizeEmail(process.env.ACCESS_REQUEST_ADMIN_EMAIL);

    if (!adminEmail) {
      adminEmail = normalizeEmail(await getProfileEmail(serviceClient, clinic.created_by));
    }

    if (adminEmail && normalizedEmail === adminEmail) {
      await ensureMembership(serviceClient, {
        clinicId: clinic.id,
        profileId: user.id,
        role: "admin",
      });

      json(res, 200, {
        status: "approved",
        message: "Acceso administrador aprobado automaticamente.",
      });
      return;
    }

    const { data: existingRequest, error: existingRequestError } = await serviceClient
      .from("access_requests")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRequestError) {
      throw existingRequestError;
    }

    const fullName =
      req.body?.fullName ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.user_metadata?.user_name ??
      null;

    let requestRecord = existingRequest;

    if (requestRecord) {
      const { data, error } = await serviceClient
        .from("access_requests")
        .update({
          profile_id: user.id,
          requested_by: user.id,
          full_name: fullName,
          last_requested_at: new Date().toISOString(),
        })
        .eq("id", requestRecord.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      requestRecord = data;
    } else {
      const { data, error } = await serviceClient
        .from("access_requests")
        .insert({
          clinic_id: clinic.id,
          profile_id: user.id,
          requested_by: user.id,
          email: normalizedEmail,
          full_name: fullName,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      requestRecord = data;
    }

    const shouldSendEmail =
      !requestRecord.notified_at ||
      Date.now() - new Date(requestRecord.notified_at).getTime() > 1000 * 60 * 15;

    let adminWasNotified = Boolean(requestRecord.notified_at);

    if (shouldSendEmail && adminEmail) {
      const approvalUrl = `${getBaseUrl(req)}/api/approve-access?token=${requestRecord.approval_token}`;
      const notificationSent = await sendAdminAccessEmail({
        to: adminEmail,
        subject: `Solicitud de acceso a NutriCRM: ${normalizedEmail}`,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #1e1b18;">
            <h2 style="margin: 0 0 12px;">Nueva solicitud de acceso</h2>
            <p><strong>Email:</strong> ${normalizedEmail}</p>
            <p><strong>Nombre:</strong> ${fullName ?? "Sin nombre"}</p>
            <p>Si queres habilitar esta cuenta en el CRM, aprobala desde este enlace:</p>
            <p>
              <a href="${approvalUrl}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#4a866a;color:#fff;text-decoration:none;font-weight:600;">
                Aprobar acceso
              </a>
            </p>
            <p style="font-size: 13px; color: #6b625a;">Si no reconoces esta solicitud, simplemente ignora este mail.</p>
          </div>
        `,
        text: [
          "Nueva solicitud de acceso a NutriCRM",
          `Email: ${normalizedEmail}`,
          `Nombre: ${fullName ?? "Sin nombre"}`,
          `Aprobar acceso: ${approvalUrl}`,
        ].join("\n"),
      });

      if (notificationSent) {
        adminWasNotified = true;
        const { error } = await serviceClient
          .from("access_requests")
          .update({
            notified_at: new Date().toISOString(),
          })
          .eq("id", requestRecord.id);

        if (error) {
          throw error;
        }
      }
    }

    json(res, 200, {
      status: existingRequest ? "already_pending" : "pending",
      message: adminWasNotified
        ? "Todavia no tenes acceso al CRM. Le enviamos tu solicitud al administrador para que la apruebe."
        : "Todavia no tenes acceso al CRM. La solicitud quedo registrada, pero falta configurar el envio de mails al administrador.",
    });
  } catch (error) {
    console.error("request-access failed", error);
    json(res, error.statusCode ?? 500, {
      error: error instanceof Error ? error.message : "No pudimos solicitar el acceso.",
    });
  }
}
