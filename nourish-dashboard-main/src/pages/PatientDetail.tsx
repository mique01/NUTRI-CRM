import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Pencil, Phone } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import AppointmentCard from "@/components/AppointmentCard";
import ClinicalHistorySection from "@/components/ClinicalHistorySection";
import FileList from "@/components/FileList";
import NotesSection from "@/components/NotesSection";
import PatientFormDialog from "@/components/PatientFormDialog";
import { useAuth } from "@/context/AuthContext";
import {
  useClinicalHistoryQuery,
  useMedicalStudiesQuery,
  useNutritionPlansQuery,
  usePatientAppointmentsQuery,
  usePatientNotesQuery,
  usePatientQuery,
} from "@/hooks/use-crm-data";
import { queryKeys } from "@/lib/queryKeys";
import { formatDate, getInitials } from "@/lib/utils";
import { createAppointment, updateAppointment } from "@/services/appointments";
import { saveClinicalHistory } from "@/services/clinicalHistory";
import {
  getMedicalStudyDownloadUrl,
  getNutritionPlanDownloadUrl,
  uploadMedicalStudy,
  uploadNutritionPlan,
} from "@/services/files";
import { createPatientNote } from "@/services/notes";
import { updatePatient } from "@/services/patients";
import type {
  AppointmentFormValues,
  ClinicalHistoryFormValues,
  PatientFormValues,
} from "@/types/domain";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { clinic, user } = useAuth();
  const queryClient = useQueryClient();
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);

  const patientQuery = usePatientQuery(id);
  const historyQuery = useClinicalHistoryQuery(id);
  const notesQuery = usePatientNotesQuery(id);
  const appointmentsQuery = usePatientAppointmentsQuery(id);
  const plansQuery = useNutritionPlansQuery(id);
  const studiesQuery = useMedicalStudiesQuery(id);

  const patient = patientQuery.data;

  const invalidatePatientData = async () => {
    if (!id) return;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patients }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patient(id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patientHistory(id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patientNotes(id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patientAppointments(id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patientPlans(id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patientStudies(id) }),
    ]);
  };

  const updatePatientMutation = useMutation({
    mutationFn: (values: PatientFormValues) =>
      updatePatient(id!, user!.id, values),
    onSuccess: async () => {
      await invalidatePatientData();
      setPatientDialogOpen(false);
      toast.success("Paciente actualizado.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar el paciente.",
      );
    },
  });

  const saveHistoryMutation = useMutation({
    mutationFn: (values: ClinicalHistoryFormValues) =>
      saveClinicalHistory(id!, user!.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientHistory(id!) });
      toast.success("Historia clínica guardada.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la historia clínica.",
      );
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (content: string) =>
      createPatientNote(clinic!.id, id!, user!.id, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientNotes(id!) });
      toast.success("Nota guardada.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la nota.");
    },
  });

  const saveAppointmentMutation = useMutation({
    mutationFn: ({
      values,
      appointmentId,
    }: {
      values: AppointmentFormValues;
      appointmentId?: string;
    }) =>
      appointmentId
        ? updateAppointment(appointmentId, values)
        : createAppointment(clinic!.id, id!, user!.id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.patientAppointments(id!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.patients }),
      ]);
      toast.success("Turno guardado.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el turno.");
    },
  });

  const uploadPlanMutation = useMutation({
    mutationFn: (file: File) => uploadNutritionPlan(clinic!.id, id!, user!.id, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientPlans(id!) });
      toast.success("Plan alimenticio subido.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el archivo.");
    },
  });

  const uploadStudyMutation = useMutation({
    mutationFn: (file: File) => uploadMedicalStudy(clinic!.id, id!, user!.id, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientStudies(id!) });
      toast.success("Estudio médico subido.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el archivo.");
    },
  });

  const plans = plansQuery.data ?? [];
  const studies = studiesQuery.data ?? [];

  const patientFormValues = useMemo<PatientFormValues | undefined>(() => {
    if (!patient) return undefined;
    return {
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: patient.birthDate ?? "",
      profession: patient.profession ?? "",
      email: patient.email ?? "",
      phone: patient.phone ?? "",
      status: patient.status,
    };
  }, [patient]);

  const isLoading =
    patientQuery.isLoading ||
    historyQuery.isLoading ||
    notesQuery.isLoading ||
    appointmentsQuery.isLoading ||
    plansQuery.isLoading ||
    studiesQuery.isLoading;

  const handleDownloadPlan = async (itemId: string) => {
    const currentPlan = plans.find((plan) => plan.id === itemId);
    if (!currentPlan) return;

    const url = await getNutritionPlanDownloadUrl(currentPlan.storagePath);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadStudy = async (itemId: string) => {
    const currentStudy = studies.find((study) => study.id === itemId);
    if (!currentStudy) return;

    const url = await getMedicalStudyDownloadUrl(currentStudy.storagePath);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 py-10 text-sm text-muted-foreground md:px-8">
          Cargando paciente...
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="px-4 py-12 text-center text-muted-foreground md:px-8">
          <p className="text-sm">Paciente no encontrado.</p>
          <Link to="/" className="mt-2 inline-block text-sm text-primary underline">
            Volver a pacientes
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Todos los pacientes
        </Link>

        <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground">
                {getInitials(patient.firstName, patient.lastName)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-card-foreground">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {patient.age !== null ? `${patient.age} años` : "Edad sin cargar"} ·{" "}
                  {patient.profession ?? "Profesión sin cargar"} ·{" "}
                  <span
                    className={
                      patient.status === "active"
                        ? "text-success"
                        : "text-muted-foreground"
                    }
                  >
                    {patient.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alta: {formatDate(patient.createdAt)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setPatientDialogOpen(true)}
              className="self-start rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
            >
              <Pencil className="mr-1.5 inline h-3.5 w-3.5" />
              Editar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {patient.email ?? "Sin email"}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {patient.phone ?? "Sin teléfono"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <ClinicalHistorySection
              history={historyQuery.data}
              isSaving={saveHistoryMutation.isPending}
              onSave={saveHistoryMutation.mutateAsync}
            />

            <AppointmentCard
              appointments={appointmentsQuery.data ?? []}
              isSaving={saveAppointmentMutation.isPending}
              onSave={(values, appointmentId) =>
                saveAppointmentMutation.mutateAsync({ values, appointmentId })
              }
            />
          </div>

          <div className="space-y-6">
            <FileList
              title="Planes alimenticios"
              items={plans.map((plan) => ({
                id: plan.id,
                title: plan.title,
                date: plan.effectiveDate,
                fileType: "pdf",
              }))}
              uploadLabel="Subir plan PDF"
              emptyMessage="Sin planes cargados todavía"
              accept=".pdf,application/pdf"
              isUploading={uploadPlanMutation.isPending}
              onUpload={uploadPlanMutation.mutateAsync}
              onDownload={handleDownloadPlan}
            />

            <FileList
              title="Estudios médicos"
              items={studies.map((study) => ({
                id: study.id,
                title: study.title,
                date: study.studyDate,
                fileType: study.fileType,
              }))}
              uploadLabel="Subir estudio"
              emptyMessage="Sin estudios cargados todavía"
              accept=".pdf,image/*"
              isUploading={uploadStudyMutation.isPending}
              onUpload={uploadStudyMutation.mutateAsync}
              onDownload={handleDownloadStudy}
            />

            <NotesSection
              notes={notesQuery.data ?? []}
              isSaving={createNoteMutation.isPending}
              onCreateNote={createNoteMutation.mutateAsync}
            />
          </div>
        </div>

        <PatientFormDialog
          open={patientDialogOpen}
          onOpenChange={setPatientDialogOpen}
          title="Editar paciente"
          description="Actualizá los datos generales del paciente."
          submitLabel="Guardar cambios"
          initialValues={patientFormValues}
          isSubmitting={updatePatientMutation.isPending}
          onSubmit={updatePatientMutation.mutateAsync}
        />
      </div>
    </AppLayout>
  );
};

export default PatientDetail;
