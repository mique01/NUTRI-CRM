import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listDashboardConsultations, listPatientAppointments } from "@/services/appointments";
import { getClinicalHistory } from "@/services/clinicalHistory";
import { listMedicalStudies, listNutritionPlans } from "@/services/files";
import { getPatientDetailBundle } from "@/services/patientDetail";
import { getPatientById, listPatients } from "@/services/patients";
import { listPatientNotes } from "@/services/notes";

export function usePatientsQuery() {
  return useQuery({
    queryKey: queryKeys.patients,
    queryFn: listPatients,
  });
}

export function useDashboardConsultationsQuery(monthDate: Date) {
  const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;

  return useQuery({
    queryKey: queryKeys.dashboardConsultations(monthKey),
    queryFn: () => listDashboardConsultations(monthDate),
  });
}

export function usePatientQuery(patientId?: string) {
  return useQuery({
    queryKey: patientId ? queryKeys.patient(patientId) : ["patients", "missing-id"],
    queryFn: () => getPatientById(patientId as string),
    enabled: Boolean(patientId),
  });
}

export function usePatientDetailQuery(patientId?: string) {
  return useQuery({
    queryKey: patientId ? queryKeys.patientDetail(patientId) : ["patients", "missing-id", "detail"],
    queryFn: () => getPatientDetailBundle(patientId as string),
    enabled: Boolean(patientId),
  });
}

export function useClinicalHistoryQuery(patientId?: string) {
  return useQuery({
    queryKey: patientId ? queryKeys.patientHistory(patientId) : ["history", "missing-id"],
    queryFn: () => getClinicalHistory(patientId as string),
    enabled: Boolean(patientId),
  });
}

export function usePatientNotesQuery(patientId?: string) {
  return useQuery({
    queryKey: patientId ? queryKeys.patientNotes(patientId) : ["notes", "missing-id"],
    queryFn: () => listPatientNotes(patientId as string),
    enabled: Boolean(patientId),
  });
}

export function usePatientAppointmentsQuery(patientId?: string) {
  return useQuery({
    queryKey: patientId
      ? queryKeys.patientAppointments(patientId)
      : ["appointments", "missing-id"],
    queryFn: () => listPatientAppointments(patientId as string),
    enabled: Boolean(patientId),
  });
}

export function useNutritionPlansQuery(patientId?: string) {
  return useQuery({
    queryKey: patientId ? queryKeys.patientPlans(patientId) : ["plans", "missing-id"],
    queryFn: () => listNutritionPlans(patientId as string),
    enabled: Boolean(patientId),
  });
}

export function useMedicalStudiesQuery(patientId?: string) {
  return useQuery({
    queryKey: patientId ? queryKeys.patientStudies(patientId) : ["studies", "missing-id"],
    queryFn: () => listMedicalStudies(patientId as string),
    enabled: Boolean(patientId),
  });
}
