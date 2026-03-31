import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { listExternalPatientAppointments } from "@/services/calendarIntegrations";
import { calculateAge } from "@/lib/utils";
import { listPatientAppointments } from "@/services/appointments";
import { getClinicalHistory } from "@/services/clinicalHistory";
import { listPatientConsultations } from "@/services/consultations";
import { listMedicalStudies, listNutritionPlans } from "@/services/files";
import { listPatientNotes } from "@/services/notes";
import { getPatientById } from "@/services/patients";
import {
  emptyClinicalHistoryFormValues,
  type Appointment,
  type ClinicalHistory,
  type MedicalStudy,
  type NutritionPlan,
  type Patient,
  type PatientConsultation,
  type PatientDetailBundle,
  type PatientNote,
  type ProfessionalProfile,
} from "@/types/domain";

function shouldFallbackToLegacyPatientBundle(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message =
    "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";

  return (
    code === "PGRST202" ||
    code === "42883" ||
    code === "42501" ||
    message.includes("get_patient_detail_bundle")
  );
}

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

function mapPatientConsultation(row: any): PatientConsultation {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    authorProfileId: row.author_profile_id ?? null,
    authorName:
      row.author_professional_title ?? row.author_name ?? "Profesional del equipo",
    authorProfessionalTitle: row.author_professional_title ?? "",
    authorSpecialty: row.author_specialty ?? "",
    consultationType: row.consultation_type ?? "",
    notes: row.notes ?? "",
    criteria: Array.isArray(row.criteria)
      ? row.criteria.map((criterion: any, index: number) => ({
          id: criterion.id ?? `${row.id}-${index}`,
          label: criterion.label ?? "",
          content: criterion.content ?? "",
        }))
      : [],
    consultedAt: row.consulted_at ?? row.created_at,
    createdAt: row.created_at,
  };
}

function getAppointmentIdentity(appointment: Appointment) {
  if (appointment.externalProvider && appointment.externalEventId) {
    return `${appointment.externalProvider}:${appointment.externalEventId}`;
  }

  return `local:${appointment.id}`;
}

function mergeAppointments(localAppointments: Appointment[], externalAppointments: Appointment[]) {
  const merged = new Map<string, Appointment>();

  [...externalAppointments, ...localAppointments].forEach((appointment) => {
    merged.set(getAppointmentIdentity(appointment), appointment);
  });

  return Array.from(merged.values()).sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

async function listExternalAppointmentsSafe(patientId: string) {
  try {
    return await listExternalPatientAppointments(patientId);
  } catch (error) {
    console.error("No pudimos sincronizar turnos externos para el paciente.", error);
    return [];
  }
}

export async function getPatientDetailBundle(
  patientId: string,
): Promise<PatientDetailBundle | null> {
  assertSupabaseConfigured();

  let { data, error } = await supabase.rpc("get_patient_detail_bundle", {
    target_patient_id: patientId,
  });

  if (error && shouldFallbackToLegacyPatientBundle(error)) {
    const [patient, history, consultations, notes, appointments, nutritionPlans, medicalStudies] =
      await Promise.all([
        getPatientById(patientId),
        getClinicalHistory(patientId),
        listPatientConsultations(patientId),
        listPatientNotes(patientId),
        listPatientAppointments(patientId),
        listNutritionPlans(patientId),
        listMedicalStudies(patientId),
      ]);

    if (!patient) {
      return null;
    }

    const externalAppointments = await listExternalAppointmentsSafe(patient.id);

    return {
      patient,
      history,
      currentProfessionalProfile: null,
      consultations,
      notes,
      appointments: mergeAppointments(appointments, externalAppointments),
      nutritionPlans,
      medicalStudies,
    };
  }

  if (error) {
    throw error;
  }

  if (!data?.patient) {
    return null;
  }

  const externalAppointments = await listExternalAppointmentsSafe(patientId);

  return {
    patient: mapPatient(data.patient),
    history: mapClinicalHistory(data.history, patientId),
    currentProfessionalProfile: data.current_professional_profile
      ? mapProfessionalProfile(data.current_professional_profile)
      : null,
    consultations: Array.isArray(data.consultations)
      ? data.consultations.map(mapPatientConsultation)
      : [],
    notes: Array.isArray(data.notes) ? data.notes.map(mapPatientNote) : [],
    appointments: mergeAppointments(
      Array.isArray(data.appointments) ? data.appointments.map(mapAppointment) : [],
      externalAppointments,
    ),
    nutritionPlans: Array.isArray(data.nutrition_plans)
      ? data.nutrition_plans.map(mapNutritionPlan)
      : [],
    medicalStudies: Array.isArray(data.medical_studies)
      ? data.medical_studies.map(mapMedicalStudy)
      : [],
  };
}
