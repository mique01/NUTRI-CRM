import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import type { PatientNote } from "@/types/domain";

function mapPatientNote(row: any): PatientNote {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    authorProfileId: row.author_profile_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function listPatientNotes(patientId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("patient_notes")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPatientNote);
}

export async function createPatientNote(
  clinicId: string,
  patientId: string,
  profileId: string,
  content: string,
) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("patient_notes")
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      author_profile_id: profileId,
      content: content.trim(),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapPatientNote(data);
}
