export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  phone: string;
  status: "active" | "inactive";
  nextAppointment: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: string;
  notes: string;
}

export interface NutritionPlan {
  id: string;
  patientId: string;
  title: string;
  date: string;
  fileUrl: string | null;
}

export interface MedicalStudy {
  id: string;
  patientId: string;
  title: string;
  date: string;
  fileType: "pdf" | "image";
  fileUrl: string | null;
}

export interface Note {
  id: string;
  patientId: string;
  content: string;
  date: string;
}

export const patients: Patient[] = [
  {
    id: "1",
    firstName: "Camila",
    lastName: "Herrera",
    age: 34,
    email: "camila.h@correo.com",
    phone: "+54 11 5432-8876",
    status: "active",
    nextAppointment: "2026-03-25",
    createdAt: "2025-09-12",
  },
  {
    id: "2",
    firstName: "Tomás",
    lastName: "Ruiz",
    age: 28,
    email: "tomas.ruiz@mail.com",
    phone: "+54 11 6789-1234",
    status: "active",
    nextAppointment: "2026-03-22",
    createdAt: "2025-11-03",
  },
  {
    id: "3",
    firstName: "Valentina",
    lastName: "López",
    age: 45,
    email: "valen.lopez@correo.com",
    phone: "+54 11 4321-5678",
    status: "inactive",
    nextAppointment: null,
    createdAt: "2025-06-18",
  },
  {
    id: "4",
    firstName: "Martín",
    lastName: "Aguirre",
    age: 52,
    email: "martin.a@email.com",
    phone: "+54 11 9988-7766",
    status: "active",
    nextAppointment: "2026-04-01",
    createdAt: "2025-08-22",
  },
  {
    id: "5",
    firstName: "Lucía",
    lastName: "Méndez",
    age: 31,
    email: "lucia.mendez@mail.com",
    phone: "+54 11 2233-4455",
    status: "active",
    nextAppointment: "2026-03-28",
    createdAt: "2026-01-10",
  },
  {
    id: "6",
    firstName: "Santiago",
    lastName: "Blanco",
    age: 39,
    email: "santi.blanco@correo.com",
    phone: "+54 11 6655-4433",
    status: "inactive",
    nextAppointment: null,
    createdAt: "2025-04-05",
  },
];

export const appointments: Appointment[] = [
  { id: "a1", patientId: "1", date: "2026-03-25", time: "10:00", type: "Follow-up", notes: "Review blood work results" },
  { id: "a2", patientId: "2", date: "2026-03-22", time: "14:30", type: "Initial consultation", notes: "" },
  { id: "a3", patientId: "4", date: "2026-04-01", time: "09:00", type: "Follow-up", notes: "Weight check" },
  { id: "a4", patientId: "5", date: "2026-03-28", time: "11:00", type: "Plan review", notes: "Adjust macros" },
  { id: "a5", patientId: "1", date: "2026-02-10", time: "10:00", type: "Initial consultation", notes: "First visit" },
];

export const nutritionPlans: NutritionPlan[] = [
  { id: "np1", patientId: "1", title: "Plan Hipocalórico — Fase 1", date: "2025-10-15", fileUrl: null },
  { id: "np2", patientId: "1", title: "Plan Hipocalórico — Fase 2", date: "2026-01-20", fileUrl: null },
  { id: "np3", patientId: "2", title: "Plan Deportivo", date: "2025-12-01", fileUrl: null },
  { id: "np4", patientId: "5", title: "Plan Vegetariano", date: "2026-02-14", fileUrl: null },
];

export const medicalStudies: MedicalStudy[] = [
  { id: "ms1", patientId: "1", title: "Blood Panel — Oct 2025", date: "2025-10-05", fileType: "pdf", fileUrl: null },
  { id: "ms2", patientId: "1", title: "Lipid Profile — Feb 2026", date: "2026-02-18", fileType: "pdf", fileUrl: null },
  { id: "ms3", patientId: "4", title: "Glucose Tolerance Test", date: "2025-09-30", fileType: "pdf", fileUrl: null },
];

export const notes: Note[] = [
  { id: "n1", patientId: "1", content: "Patient reports improved energy levels after switching to phase 2 plan. Continue monitoring.", date: "2026-02-10" },
  { id: "n2", patientId: "1", content: "Initial consultation — discussed goals: weight loss, better sleep. Family history of diabetes.", date: "2025-09-12" },
  { id: "n3", patientId: "2", content: "Athlete preparing for marathon. Needs high-carb plan with recovery nutrition.", date: "2025-11-03" },
  { id: "n4", patientId: "5", content: "Transitioning to vegetarian diet. Need to ensure B12 and iron intake.", date: "2026-01-10" },
];
