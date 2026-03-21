import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/utils";
import {
  emptyClinicalHistoryFormValues,
  type Appointment,
  type ClinicalHistory,
  type MedicalStudy,
  type NutritionPlan,
  type Patient,
  type PatientDetailBundle,
  type PatientNote,
} from "@/types/domain";

function normalizeAlerts(value?: string | string[] | null) {
  if (Array.isArray(value)) {
    return value.map((entry) => entry.trim()).filter(Boolean);
  }

  return (value ?? "")
    .split("\n")
    .map((entry) => entry.replace(/^[â€¢*-]\s*/, "").trim())
    .filter(Boolean);
}

function mapPatient(row: any): Patient {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    age: calculateAge(row.birth_date),
    profession: row.profession,
    email: row.email,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    alerts: normalizeAlerts(row.alerts),
    nextAppointmentAt: row.next_appointment_at ?? null,
    lastAppointmentAt: row.last_appointment_at ?? null,
  };
}

function mapClinicalHistory(row: any, patientId: string): ClinicalHistory {
  if (!row) {
    return {
      patientId,
      ...emptyClinicalHistoryFormValues,
      updatedAt: null,
    };
  }

  return {
    patientId: row.patient_id,
    consultationReason: row.consultation_reason ?? "",
    objective: row.objective ?? "",
    pathologiesHistorySurgeries: row.pathologies_history_surgeries ?? "",
    medicationsSupplements: row.medications_supplements ?? "",
    eatingHabits: row.eating_habits ?? "",
    allergiesIntolerances: row.allergies_intolerances ?? "",
    physicalActivity: row.physical_activity ?? "",
    stress: row.stress ?? "",
    sleep: row.sleep ?? "",
    digestiveSystem: row.digestive_system ?? "",
    menstrualCycles: row.menstrual_cycles ?? "",
    otherObservations: row.other_observations ?? "",
    updatedAt: row.updated_at ?? null,
  };
}

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

function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    nutritionistProfileId: row.nutritionist_profile_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    appointmentType: row.appointment_type,
    notes: row.notes ?? "",
    status: row.status,
    externalProvider: row.external_provider,
    externalEventId: row.external_event_id,
    syncState: row.sync_state,
  };
}

function mapNutritionPlan(row: any): NutritionPlan {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    title: row.title,
    effectiveDate: row.effective_date,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

function mapMedicalStudy(row: any): MedicalStudy {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    title: row.title,
    studyDate: row.study_date,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export async function getPatientDetailBundle(
  patientId: string,
): Promise<PatientDetailBundle | null> {
  assertSupabaseConfigured();

  const { data, error } = await supabase.rpc("get_patient_detail_bundle", {
    target_patient_id: patientId,
  });

  if (error) {
    throw error;
  }

  if (!data?.patient) {
    return null;
  }

  return {
    patient: mapPatient(data.patient),
    history: mapClinicalHistory(data.history, patientId),
    notes: Array.isArray(data.notes) ? data.notes.map(mapPatientNote) : [],
    appointments: Array.isArray(data.appointments)
      ? data.appointments.map(mapAppointment)
      : [],
    nutritionPlans: Array.isArray(data.nutrition_plans)
      ? data.nutrition_plans.map(mapNutritionPlan)
      : [],
    medicalStudies: Array.isArray(data.medical_studies)
      ? data.medical_studies.map(mapMedicalStudy)
      : [],
  };
}
