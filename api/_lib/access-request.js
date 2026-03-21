import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseConfig() {
  return {
    url: requireEnv("VITE_SUPABASE_URL"),
    anonKey: requireEnv("VITE_SUPABASE_ANON_KEY"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function createServiceRoleClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAuthClient() {
  const { url, anonKey } = getSupabaseConfig();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getBaseUrl(req) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }

  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  return `${proto}://${host}`;
}

export function normalizeEmail(value) {
  return (value ?? "").trim().toLowerCase();
}

export async function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    throw Object.assign(new Error("Missing access token."), { statusCode: 401 });
  }

  const authClient = createAuthClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error || !user) {
    throw Object.assign(new Error("Invalid Supabase session."), { statusCode: 401 });
  }

  return user;
}

export async function getPrimaryClinic(serviceClient) {
  const { data, error } = await serviceClient
    .from("clinics")
    .select("id, name, created_by")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getProfileEmail(serviceClient, profileId) {
  if (!profileId) {
    return null;
  }

  const { data, error } = await serviceClient
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.email ?? null;
}

export async function getMembership(serviceClient, profileId) {
  const { data, error } = await serviceClient
    .from("clinic_memberships")
    .select("id, clinic_id, role")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureMembership(serviceClient, { clinicId, profileId, role }) {
  const { data, error } = await serviceClient
    .from("clinic_memberships")
    .upsert(
      {
        clinic_id: clinicId,
        profile_id: profileId,
        role,
      },
      {
        onConflict: "clinic_id,profile_id",
      },
    )
    .select("id, clinic_id, profile_id, role")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function sendAdminAccessEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);

  if (!apiKey || !from || recipients.length === 0) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend request failed: ${details}`);
  }

  return true;
}

export function renderApprovalPage({ title, message, tone = "neutral" }) {
  const border = tone === "success" ? "#4a866a" : tone === "error" ? "#e25d4d" : "#d9d4cf";
  const background = tone === "success" ? "#eef7f1" : tone === "error" ? "#fdf1ef" : "#f7f4f1";

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f5f1eb; color: #1e1b18; }
      .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
      .card { max-width: 520px; width: 100%; background: #fff; border: 1px solid ${border}; border-radius: 24px; padding: 32px; box-shadow: 0 20px 60px rgba(38, 33, 28, 0.08); }
      .badge { display: inline-block; padding: 8px 14px; border-radius: 999px; background: ${background}; color: #433b35; font-size: 13px; font-weight: 600; }
      h1 { margin: 18px 0 10px; font-size: 28px; line-height: 1.15; }
      p { margin: 0; font-size: 16px; line-height: 1.6; color: #5f554d; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="card">
        <span class="badge">NutriCRM</span>
        <h1>${title}</h1>
        <p>${message}</p>
      </section>
    </div>
  </body>
</html>`;
}
