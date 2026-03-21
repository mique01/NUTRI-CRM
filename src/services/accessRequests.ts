import type { Session } from "@supabase/supabase-js";

interface AccessRequestResponse {
  status: "approved" | "member" | "pending" | "already_pending" | "pending_bootstrap";
  message: string;
}

export async function submitAccessRequest(session: Session): Promise<AccessRequestResponse> {
  const response = await fetch("/api/request-access", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      email: session.user.email ?? "",
      fullName:
        session.user.user_metadata?.full_name ??
        session.user.user_metadata?.name ??
        session.user.user_metadata?.user_name ??
        null,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | AccessRequestResponse
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "No se pudo solicitar acceso al administrador.");
  }

  return {
    status: payload?.status ?? "pending",
    message:
      payload?.message ??
      "Tu solicitud fue enviada al administrador. Cuando la apruebe, vas a poder ingresar.",
  };
}
