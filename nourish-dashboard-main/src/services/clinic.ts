import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ClinicMembership, InviteRecord } from "@/types/domain";

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
