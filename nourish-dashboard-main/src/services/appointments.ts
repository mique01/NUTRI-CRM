import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { addMinutesToIsoString, combineDateAndTime } from "@/lib/utils";
import type { Appointment, AppointmentFormValues } from "@/types/domain";

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

function normalizeAppointment(values: AppointmentFormValues) {
  const startsAt = combineDateAndTime(values.date, values.time);
  return {
    starts_at: startsAt,
    ends_at: addMinutesToIsoString(startsAt, values.durationMinutes),
    appointment_type: values.appointmentType.trim(),
    notes: values.notes.trim(),
    status: values.status,
  };
}

export async function listPatientAppointments(patientId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapAppointment);
}

export async function createAppointment(
  clinicId: string,
  patientId: string,
  profileId: string,
  values: AppointmentFormValues,
) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      nutritionist_profile_id: profileId,
      sync_state: "not_connected",
      ...normalizeAppointment(values),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapAppointment(data);
}

export async function updateAppointment(
  appointmentId: string,
  values: AppointmentFormValues,
) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("appointments")
    .update(normalizeAppointment(values))
    .eq("id", appointmentId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapAppointment(data);
}
