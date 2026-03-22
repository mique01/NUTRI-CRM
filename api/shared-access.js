import crypto from "node:crypto";
import { getAuthenticatedUser } from "./_lib/access-request.js";

const COOKIE_NAME = "nutricrm_shared_access";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

function json(res, status, payload) {
  res.status(status).json(payload);
}

function getSharedAccessPassword() {
  return process.env.CONTRASENA_MEDICAS ?? process.env.SHARED_ACCESS_PASSWORD ?? "";
}

function parseCookies(req) {
  const header = req.headers.cookie ?? "";

  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        const key = separator >= 0 ? part.slice(0, separator) : part;
        const value = separator >= 0 ? part.slice(separator + 1) : "";
        return [key, decodeURIComponent(value)];
      }),
  );
}

function signPayload(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function buildCookieValue(userId, secret) {
  const expiresAt = Date.now() + COOKIE_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

function verifyCookieValue(cookieValue, userId, secret) {
  if (!cookieValue || !secret) {
    return false;
  }

  const [cookieUserId, expiresAtRaw, signature] = cookieValue.split(".");

  if (!cookieUserId || !expiresAtRaw || !signature || cookieUserId !== userId) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  const payload = `${cookieUserId}.${expiresAt}`;
  const expectedSignature = signPayload(payload, secret);

  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expectedSignature, "utf8"),
  );
}

function setSharedAccessCookie(res, value) {
  const secure = process.env.NODE_ENV !== "development";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
  ];

  if (secure) {
    parts.push("Secure");
  }

  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSharedAccessCookie(res) {
  const secure = process.env.NODE_ENV !== "development";
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
  ];

  if (secure) {
    parts.push("Secure");
  }

  res.setHeader("Set-Cookie", parts.join("; "));
}

export default async function handler(req, res) {
  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    json(res, 405, { error: "Method not allowed." });
    return;
  }

  const sharedAccessPassword = getSharedAccessPassword();

  if (!sharedAccessPassword) {
    if (req.method === "DELETE") {
      clearSharedAccessCookie(res);
      res.status(204).end();
      return;
    }

    json(res, 200, { required: false, unlocked: true });
    return;
  }

  if (req.method === "DELETE") {
    clearSharedAccessCookie(res);
    res.status(204).end();
    return;
  }

  try {
    const user = await getAuthenticatedUser(req);
    const cookies = parseCookies(req);
    const isUnlocked = verifyCookieValue(
      cookies[COOKIE_NAME],
      user.id,
      sharedAccessPassword,
    );

    if (req.method === "GET") {
      json(res, 200, { required: true, unlocked: isUnlocked });
      return;
    }

    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const matches =
      password.length === sharedAccessPassword.length &&
      crypto.timingSafeEqual(
        Buffer.from(password, "utf8"),
        Buffer.from(sharedAccessPassword, "utf8"),
      );

    if (!matches) {
      clearSharedAccessCookie(res);
      json(res, 401, { error: "La contraseña secundaria es incorrecta." });
      return;
    }

    setSharedAccessCookie(res, buildCookieValue(user.id, sharedAccessPassword));
    json(res, 200, { required: true, unlocked: true });
  } catch (error) {
    console.error("shared-access failed", error);
    json(res, error.statusCode ?? 500, {
      error:
        error instanceof Error ? error.message : "No pudimos validar la contraseña secundaria.",
    });
  }
}
