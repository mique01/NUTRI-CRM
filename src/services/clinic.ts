import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AccessState, ClinicMembership, InviteRecord } from "@/types/domain";

function mapMembership(row: any): ClinicMembership {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    profileId: row.profile_id,
    role: row.role,
    clinic: {
      id: row.clinic.id,
      name: row.clinic.name,
      createdAt: row.clinic.created_at,
    },
  };
}

function mapInvite(row: any): InviteRecord {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    invitedEmail: row.invited_email,
    inviteToken: row.invite_token,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function getCurrentClinicMembership(profileId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("clinic_memberships")
    .select("id, clinic_id, profile_id, role, clinic:clinics(id, name, created_at)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapMembership(data) : null;
}

export async function getMyAccessState() {
  assertSupabaseConfigured();

  const { data, error } = await supabase.rpc("get_my_access_state");

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  const accessState: AccessState = {
    status: row?.access_status ?? "denied",
    clinicId: row?.clinic_id ?? null,
    clinicName: row?.clinic_name ?? null,
    invitedEmail: row?.invited_email ?? null,
  };

  return accessState;
}

export async function bootstrapClinic(clinicName: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.rpc("bootstrap_clinic", {
    clinic_name: clinicName,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function createClinicInvite(invitedEmail: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.rpc("create_clinic_invite", {
    invited_email: invitedEmail,
  });

  if (error) {
    throw error;
  }

  const invite = mapInvite(data);
  return {
    ...invite,
    shareUrl: `${window.location.origin}/auth/callback?invite=${invite.inviteToken}`,
  };
}

export async function acceptClinicInvite(inviteToken: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.rpc("accept_clinic_invite", {
    invite_token: inviteToken,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function acceptMyClinicInvite() {
  assertSupabaseConfigured();

  const { data, error } = await supabase.rpc("accept_my_clinic_invite");

  if (error) {
    throw error;
  }

  return data;
}

export async function tryAcceptSupabaseAuthInvite() {
  assertSupabaseConfigured();

  const { data, error } = await supabase.rpc("try_accept_supabase_auth_invite");

  if (error) {
    if (error.code === "PGRST202") {
      return null;
    }

    throw error;
  }

  return data ? mapMembership(data) : null;
}
