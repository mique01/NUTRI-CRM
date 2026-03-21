import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  emptyClinicalHistoryFormValues,
  type ClinicalHistory,
  type ClinicalHistoryFormValues,
} from "@/types/domain";

const CLINICAL_HISTORY_SELECT =
  "patient_id, consultation_reason, objective, pathologies_history_surgeries, medications_supplements, eating_habits, allergies_intolerances, physical_activity, stress, sleep, digestive_system, menstrual_cycles, other_observations, updated_at";

function mapClinicalHistory(row: any): ClinicalHistory {
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

function normalizeClinicalHistory(values: ClinicalHistoryFormValues) {
  return {
    consultation_reason: values.consultationReason.trim(),
    objective: values.objective.trim(),
    pathologies_history_surgeries: values.pathologiesHistorySurgeries.trim(),
    medications_supplements: values.medicationsSupplements.trim(),
    eating_habits: values.eatingHabits.trim(),
    allergies_intolerances: values.allergiesIntolerances.trim(),
    physical_activity: values.physicalActivity.trim(),
    stress: values.stress.trim(),
    sleep: values.sleep.trim(),
    digestive_system: values.digestiveSystem.trim(),
    menstrual_cycles: values.menstrualCycles.trim(),
    other_observations: values.otherObservations.trim(),
  };
}

export async function getClinicalHistory(patientId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("patient_clinical_histories")
    .select(CLINICAL_HISTORY_SELECT)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? mapClinicalHistory(data)
    : {
        patientId,
        ...emptyClinicalHistoryFormValues,
        updatedAt: null,
      };
}

export async function saveClinicalHistory(
  patientId: string,
  profileId: string,
  values: ClinicalHistoryFormValues,
) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("patient_clinical_histories")
    .upsert({
      patient_id: patientId,
      updated_by: profileId,
      ...normalizeClinicalHistory(values),
    })
    .select(CLINICAL_HISTORY_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapClinicalHistory(data);
}
