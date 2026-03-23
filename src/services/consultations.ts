import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  ConsultationCriterionFormValue,
  PatientConsultationFormValues,
  ProfessionalProfile,
} from "@/types/domain";

const PROFILE_SELECT =
  "id, email, full_name, professional_title, specialty, avatar_url";

function normalizeConsultationCriteria(
  criteria: ConsultationCriterionFormValue[],
) {
  return criteria
    .map((criterion) => ({
      id: criterion.id,
      label: criterion.label.trim(),
      content: criterion.content
        .split("\n")
        .map((line) => line.trim())
        .map((line) => line.replace(/^(?:\u2022|-|\*)\s*/, "").trim())
        .filter(Boolean)
        .map((line) => `• ${line}`)
        .join("\n"),
    }))
    .filter((criterion) => criterion.label || criterion.content);
}

function normalizeProfileValue(value: string) {
  return value.trim();
}

function mapProfessionalProfile(row: any): ProfessionalProfile {
  return {
    id: row.id,
    email: row.email ?? "",
    fullName: row.full_name ?? row.email ?? "",
    professionalTitle: row.professional_title ?? "",
    specialty: row.specialty ?? "",
    avatarUrl: row.avatar_url ?? null,
  };
}

export async function getProfessionalProfile(profileId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfessionalProfile(data) : null;
}

export async function updateProfessionalProfile(
  profileId: string,
  values: {
    professionalTitle: string;
    specialty: string;
  },
) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      professional_title: normalizeProfileValue(values.professionalTitle) || null,
      specialty: normalizeProfileValue(values.specialty) || null,
    })
    .eq("id", profileId)
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapProfessionalProfile(data);
}

export async function createPatientConsultation(
  clinicId: string,
  patientId: string,
  profileId: string,
  values: PatientConsultationFormValues,
) {
  assertSupabaseConfigured();

  const payload = {
    clinic_id: clinicId,
    patient_id: patientId,
    author_profile_id: profileId,
    consultation_type: values.consultationType.trim() || "Consulta",
    notes: values.notes.trim(),
    criteria: normalizeConsultationCriteria(values.criteria),
  };

  const { error } = await supabase.from("patient_consultations").insert(payload);

  if (error) {
    throw error;
  }
}
