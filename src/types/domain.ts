export type ClinicMembershipRole = "admin" | "nutritionist";
export type PatientStatus = "active" | "inactive";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type StudyFileType = "pdf" | "image";
export type ExternalProvider = "google_calendar" | null;
export type SyncState = "not_connected" | "local_only" | "synced" | "sync_error";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface Clinic {
  id: string;
  name: string;
  createdAt: string;
}

export interface ClinicMembership {
  id: string;
  clinicId: string;
  profileId: string;
  role: ClinicMembershipRole;
  clinic: Clinic;
}

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  age: number | null;
  profession: string | null;
  email: string | null;
  phone: string | null;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
  nextAppointmentAt: string | null;
}

export interface PatientFormValues {
  firstName: string;
  lastName: string;
  birthDate: string;
  profession: string;
  email: string;
  phone: string;
  status: PatientStatus;
}

export interface ClinicalHistory {
  patientId: string;
  consultationReason: string;
  objective: string;
  pathologiesHistorySurgeries: string;
  medicationsSupplements: string;
  eatingHabits: string;
  allergiesIntolerances: string;
  physicalActivity: string;
  stress: string;
  sleep: string;
  digestiveSystem: string;
  menstrualCycles: string;
  otherObservations: string;
  updatedAt: string | null;
}

export interface ClinicalHistoryFormValues {
  consultationReason: string;
  objective: string;
  pathologiesHistorySurgeries: string;
  medicationsSupplements: string;
  eatingHabits: string;
  allergiesIntolerances: string;
  physicalActivity: string;
  stress: string;
  sleep: string;
  digestiveSystem: string;
  menstrualCycles: string;
  otherObservations: string;
}

export interface PatientNote {
  id: string;
  clinicId: string;
  patientId: string;
  authorProfileId: string;
  content: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  nutritionistProfileId: string;
  startsAt: string;
  endsAt: string;
  appointmentType: string;
  notes: string;
  status: AppointmentStatus;
  externalProvider: ExternalProvider;
  externalEventId: string | null;
  syncState: SyncState;
}

export interface AppointmentFormValues {
  date: string;
  time: string;
  durationMinutes: number;
  appointmentType: string;
  notes: string;
  status: AppointmentStatus;
}

export interface NutritionPlan {
  id: string;
  clinicId: string;
  patientId: string;
  title: string;
  effectiveDate: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  createdAt: string;
}

export interface MedicalStudy {
  id: string;
  clinicId: string;
  patientId: string;
  title: string;
  studyDate: string;
  fileType: StudyFileType;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  createdAt: string;
}

export interface InviteRecord {
  id: string;
  clinicId: string;
  invitedEmail: string;
  inviteToken: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
}

export const emptyPatientFormValues: PatientFormValues = {
  firstName: "",
  lastName: "",
  birthDate: "",
  profession: "",
  email: "",
  phone: "",
  status: "active",
};

export const emptyClinicalHistoryFormValues: ClinicalHistoryFormValues = {
  consultationReason: "",
  objective: "",
  pathologiesHistorySurgeries: "",
  medicationsSupplements: "",
  eatingHabits: "",
  allergiesIntolerances: "",
  physicalActivity: "",
  stress: "",
  sleep: "",
  digestiveSystem: "",
  menstrualCycles: "",
  otherObservations: "",
};

export const emptyAppointmentFormValues: AppointmentFormValues = {
  date: "",
  time: "",
  durationMinutes: 45,
  appointmentType: "Seguimiento",
  notes: "",
  status: "scheduled",
};
