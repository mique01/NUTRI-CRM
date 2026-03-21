import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/utils";
import type { Patient, PatientFormValues } from "@/types/domain";

const PATIENT_BASE_SELECT =
  "id, clinic_id, first_name, last_name, birth_date, profession, email, phone, status, created_at, updated_at";
const PATIENT_WITH_ALERTS_SELECT = `${PATIENT_BASE_SELECT}, alerts`;
const LEGACY_PATIENT_WITH_APPOINTMENTS_SELECT = `${PATIENT_WITH_ALERTS_SELECT}, appointments(starts_at, status)`;
const LEGACY_PATIENT_BASE_WITH_APPOINTMENTS_SELECT = `${PATIENT_BASE_SELECT}, appointments(starts_at, status)`;

function getNextAppointment(appointments: Array<{ starts_at: string; status: string }> = []) {
  const now = new Date();

  return appointments
    .filter((appointment) => appointment.status === "scheduled")
    .filter((appointment) => new Date(appointment.starts_at).getTime() >= now.getTime())
    .sort(
      (left, right) =>
        new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
    )[0]?.starts_at ?? null;
}

function getLastAppointment(appointments: Array<{ starts_at: string; status: string }> = []) {
  return appointments
    .filter((appointment) => appointment.status !== "cancelled")
    .sort(
      (left, right) =>
        new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime(),
    )[0]?.starts_at ?? null;
}

function normalizeAlerts(value?: string | string[] | null) {
  if (Array.isArray(value)) {
    return value.map((entry) => entry.trim()).filter(Boolean);
  }

  return (value ?? "")
    .split("\n")
    .map((entry) => entry.replace(/^[•*-]\s*/, "").trim())
    .filter(Boolean);
}

function isMissingAlertsColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";

  return message.toLowerCase().includes("alerts");
}

function shouldFallbackToLegacyPatientsQuery(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message =
    "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";

  return (
    code === "PGRST202" ||
    code === "42883" ||
    code === "42501" ||
    message.includes("list_patients_overview")
  );
}

async function selectLegacyPatientsList(withAlerts: boolean) {
  return supabase
    .from("patients")
    .select(
      withAlerts
        ? LEGACY_PATIENT_WITH_APPOINTMENTS_SELECT
        : LEGACY_PATIENT_BASE_WITH_APPOINTMENTS_SELECT,
    )
    .order("created_at", { ascending: false });
}

async function selectPatientsList(withAlerts: boolean) {
  if (!withAlerts) {
    return supabase
      .from("patients")
      .select(PATIENT_BASE_SELECT)
      .order("created_at", { ascending: false });
  }

  return supabase.rpc("list_patients_overview");
}

async function selectPatientById(patientId: string, withAlerts: boolean) {
  return supabase
    .from("patients")
    .select(withAlerts ? PATIENT_WITH_ALERTS_SELECT : PATIENT_BASE_SELECT)
    .eq("id", patientId)
    .maybeSingle();
}

async function insertPatient(payload: Record<string, unknown>, withAlerts: boolean) {
  const fallbackPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => key !== "alerts"),
  );

  return supabase
    .from("patients")
    .insert(withAlerts ? payload : fallbackPayload)
    .select(withAlerts ? PATIENT_WITH_ALERTS_SELECT : PATIENT_BASE_SELECT)
    .single();
}

async function updatePatientRecord(
  patientId: string,
  payload: Record<string, unknown>,
  withAlerts: boolean,
) {
  const fallbackPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => key !== "alerts"),
  );

  return supabase
    .from("patients")
    .update(withAlerts ? payload : fallbackPayload)
    .eq("id", patientId)
    .select(withAlerts ? PATIENT_WITH_ALERTS_SELECT : PATIENT_BASE_SELECT)
    .single();
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
    nextAppointmentAt:
      row.nextAppointmentAt ?? row.next_appointment_at ?? getNextAppointment(row.appointments),
    lastAppointmentAt:
      row.lastAppointmentAt ?? row.last_appointment_at ?? getLastAppointment(row.appointments),
  };
}

function normalizePatientPayload(values: PatientFormValues) {
  return {
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    birth_date: values.birthDate || null,
    profession: values.profession.trim() || null,
    email: values.email.trim().toLowerCase() || null,
    phone: values.phone.trim() || null,
    alerts: normalizeAlerts(values.alerts).join("\n") || "",
    status: values.status,
  };
}

export async function listPatients() {
  assertSupabaseConfigured();
  let usedLegacySelect = false;

  let { data, error } = await selectPatientsList(true);

  if (error && shouldFallbackToLegacyPatientsQuery(error)) {
    usedLegacySelect = true;
    ({ data, error } = await selectLegacyPatientsList(true));
  }

  if (error && isMissingAlertsColumn(error)) {
    ({ data, error } = usedLegacySelect
      ? await selectLegacyPatientsList(false)
      : await selectPatientsList(false));
  }

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPatient);
}

export async function getPatientById(patientId: string) {
  assertSupabaseConfigured();

  let { data, error } = await selectPatientById(patientId, true);

  if (error && isMissingAlertsColumn(error)) {
    ({ data, error } = await selectPatientById(patientId, false));
  }

  if (error) {
    throw error;
  }

  return data ? mapPatient(data) : null;
}

export async function createPatient(
  clinicId: string,
  profileId: string,
  values: PatientFormValues,
) {
  assertSupabaseConfigured();

  const payload = {
    clinic_id: clinicId,
    created_by: profileId,
    updated_by: profileId,
    ...normalizePatientPayload(values),
  };

  let { data, error } = await insertPatient(payload, true);

  if (error && isMissingAlertsColumn(error)) {
    ({ data, error } = await insertPatient(payload, false));
  }

  if (error) {
    throw error;
  }

  return mapPatient({ ...data, appointments: [] });
}

export async function updatePatient(
  patientId: string,
  profileId: string,
  values: PatientFormValues,
) {
  assertSupabaseConfigured();

  const payload = {
    ...normalizePatientPayload(values),
    updated_by: profileId,
  };

  let { data, error } = await updatePatientRecord(patientId, payload, true);

  if (error && isMissingAlertsColumn(error)) {
    ({ data, error } = await updatePatientRecord(patientId, payload, false));
  }

  if (error) {
    throw error;
  }

  return mapPatient({ ...data, appointments: [] });
}

export async function deletePatient(patientId: string) {
  assertSupabaseConfigured();

  const { error } = await supabase.from("patients").delete().eq("id", patientId);

  if (error) {
    throw error;
  }
}
