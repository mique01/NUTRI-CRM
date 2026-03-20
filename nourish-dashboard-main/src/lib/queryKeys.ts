export const queryKeys = {
  clinicContext: ["clinic-context"] as const,
  patients: ["patients"] as const,
  patient: (patientId: string) => ["patients", patientId] as const,
  patientHistory: (patientId: string) => ["patients", patientId, "history"] as const,
  patientNotes: (patientId: string) => ["patients", patientId, "notes"] as const,
  patientAppointments: (patientId: string) => ["patients", patientId, "appointments"] as const,
  patientPlans: (patientId: string) => ["patients", patientId, "plans"] as const,
  patientStudies: (patientId: string) => ["patients", patientId, "studies"] as const,
} as const;
