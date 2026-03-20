import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/utils";
import type { Patient, PatientFormValues } from "@/types/domain";

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
    return value
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return (value ?? "")
    .split("\n")
    .map((entry) => entry.replace(/^[•*-]\s*/, "").trim())
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
    nextAppointmentAt: row.nextAppointmentAt ?? getNextAppointment(row.appointments),
    lastAppointmentAt: row.lastAppointmentAt ?? getLastAppointment(row.appointments),
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

  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, clinic_id, first_name, last_name, birth_date, profession, email, phone, alerts, status, created_at, updated_at, appointments(starts_at, status)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPatient);
}

export async function getPatientById(patientId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("patients")
    .select("id, clinic_id, first_name, last_name, birth_date, profession, email, phone, alerts, status, created_at, updated_at, appointments(starts_at, status)")
    .eq("id", patientId)
    .maybeSingle();

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

  const { data, error } = await supabase
    .from("patients")
    .insert(payload)
    .select("id, clinic_id, first_name, last_name, birth_date, profession, email, phone, alerts, status, created_at, updated_at")
    .single();

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

  const { data, error } = await supabase
    .from("patients")
    .update({
      ...normalizePatientPayload(values),
      updated_by: profileId,
    })
    .eq("id", patientId)
    .select("id, clinic_id, first_name, last_name, birth_date, profession, email, phone, alerts, status, created_at, updated_at")
    .single();

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
