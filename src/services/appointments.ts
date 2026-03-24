import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { addMinutesToIsoString, combineDateAndTime } from "@/lib/utils";
import type {
  Appointment,
  AppointmentFormValues,
  DashboardConsultation,
} from "@/types/domain";

const APPOINTMENT_SELECT =
  "id, clinic_id, patient_id, nutritionist_profile_id, starts_at, ends_at, appointment_type, notes, status, external_provider, external_event_id, sync_state";

function shouldFallbackToLegacyDashboardQuery(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message =
    "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";

  return (
    code === "PGRST202" ||
    code === "42883" ||
    code === "42501" ||
    message.includes("list_dashboard_consultations")
  );
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
    .select(APPOINTMENT_SELECT)
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
    .select(APPOINTMENT_SELECT)
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
    .select(APPOINTMENT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapAppointment(data);
}

export async function listDashboardConsultations(monthDate = new Date()) {
  assertSupabaseConfigured();

  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);

  let { data, error } = await supabase.rpc("list_dashboard_consultations", {
    month_start: monthStart.toISOString(),
    month_end: monthEnd.toISOString(),
  });

  if (error && shouldFallbackToLegacyDashboardQuery(error)) {
    ({ data, error } = await supabase
      .from("appointments")
      .select("id, patient_id, starts_at, status, patients!inner(first_name, last_name)")
      .gte("starts_at", monthStart.toISOString())
      .lt("starts_at", monthEnd.toISOString())
      .order("starts_at", { ascending: true }));
  }

  if (error) {
    throw error;
  }

  return ((data ?? []) as any[]).map(
    (row): DashboardConsultation => {
      const patient = Array.isArray((row as any).patients) ? (row as any).patients[0] : (row as any).patients;

      return {
        id: row.id,
        patientId: row.patient_id ?? null,
        patientName: row.patient_name ?? `${patient?.first_name ?? ""} ${patient?.last_name ?? ""}`.trim(),
        startsAt: row.starts_at,
        endsAt: null,
        status: row.status,
        sourceProvider: "local",
      };
    },
  );
}
