import type { User } from "@supabase/supabase-js";
import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { getDisplayName } from "@/lib/utils";
import type { AuthUser } from "@/types/domain";

const ACCESS_DENIED_STORAGE_KEY = "nutricrm.accessDeniedMessage";
const DEFAULT_DENIED_MESSAGE =
  "Solo pueden ingresar los emails autorizados e invitados desde Supabase.";

function mapUser(user: User): AuthUser {
  const fullName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.user_metadata?.user_name ??
    null;

  return {
    id: user.id,
    email: user.email ?? "",
    name: getDisplayName(fullName, user.email ?? null),
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  };
}

export async function signInWithAuthorizedEmail(email: string) {
  assertSupabaseConfigured();

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Ingresa un email autorizado.");
  }

  const redirectUrl = new URL("/auth/callback", window.location.origin);

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: redirectUrl.toString(),
      shouldCreateUser: false,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  assertSupabaseConfigured();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function exchangeCodeForSession(currentUrl: string) {
  assertSupabaseConfigured();
  const url = new URL(currentUrl);
  if (!url.searchParams.get("code")) return;

  const { error } = await supabase.auth.exchangeCodeForSession(currentUrl);
  if (error) {
    throw error;
  }
}

export async function syncCurrentProfile(user: User) {
  assertSupabaseConfigured();

  const payload = {
    id: user.id,
    email: (user.email ?? "").toLowerCase(),
    full_name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.user_metadata?.user_name ??
      null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  };

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}

export function mapAuthUser(user: User | null) {
  return user ? mapUser(user) : null;
}

export function persistDeniedAccessMessage(message = DEFAULT_DENIED_MESSAGE) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ACCESS_DENIED_STORAGE_KEY, message);
}

export function getDeniedAccessMessage() {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(ACCESS_DENIED_STORAGE_KEY);
}

export function clearDeniedAccessMessage() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(ACCESS_DENIED_STORAGE_KEY);
}

export function getDefaultDeniedAccessMessage() {
  return DEFAULT_DENIED_MESSAGE;
}
