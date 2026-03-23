import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Pencil, Phone, Trash2, TriangleAlert } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import ConsultationsSection from "@/components/ConsultationsSection";
import FileList from "@/components/FileList";
import NotesSection from "@/components/NotesSection";
import PatientFormDialog from "@/components/PatientFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import {
  usePatientDetailQuery,
} from "@/hooks/use-crm-data";
import { queryKeys } from "@/lib/queryKeys";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { createPatientConsultation } from "@/services/consultations";
import {
  deleteMedicalStudy,
  deleteNutritionPlan,
  getMedicalStudyDownloadUrl,
  getNutritionPlanDownloadUrl,
  uploadMedicalStudy,
  uploadNutritionPlan,
} from "@/services/files";
import { createPatientNote, deletePatientNote } from "@/services/notes";
import { deletePatient, updatePatient } from "@/services/patients";
import type { PatientConsultationFormValues, PatientFormValues } from "@/types/domain";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinic, user } = useAuth();
  const queryClient = useQueryClient();
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [planUploadStatus, setPlanUploadStatus] = useState<string | null>(null);
  const [studyUploadStatus, setStudyUploadStatus] = useState<string | null>(null);

  const patientDetailQuery = usePatientDetailQuery(id);

  const patient = patientDetailQuery.data?.patient ?? null;
  const currentProfessionalProfile = patientDetailQuery.data?.currentProfessionalProfile ?? null;
  const consultations = patientDetailQuery.data?.consultations ?? [];
  const notes = patientDetailQuery.data?.notes ?? [];
  const appointments = patientDetailQuery.data?.appointments ?? [];
  const plans = patientDetailQuery.data?.nutritionPlans ?? [];
  const studies = patientDetailQuery.data?.medicalStudies ?? [];
  const now = Date.now();
  const lastAppointment =
    [...appointments]
      .filter((appointment) => appointment.status !== "cancelled")
      .filter((appointment) => new Date(appointment.startsAt).getTime() <= now)
      .sort(
        (left, right) =>
          new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
      )[0] ?? null;

  const invalidatePatientData = async () => {
    if (!id) return;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patients }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patient(id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(id) }),
    ]);
  };

  const updatePatientMutation = useMutation({
    mutationFn: (values: PatientFormValues) => updatePatient(id!, user!.id, values),
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

  const deletePatientMutation = useMutation({
    mutationFn: () => deletePatient(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      toast.success("Paciente eliminado.");
      navigate("/patients");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el paciente.",
      );
    },
  });

  const createConsultationMutation = useMutation({
    mutationFn: (values: PatientConsultationFormValues) =>
      createPatientConsultation(clinic!.id, id!, user!.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(id!) });
      toast.success("Consulta guardada.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar la consulta.",
      );
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (content: string) => createPatientNote(clinic!.id, id!, user!.id, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(id!) });
      toast.success("Nota guardada.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la nota.");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => deletePatientNote(noteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(id!) });
      toast.success("Nota eliminada.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la nota.");
    },
  });

  const uploadPlanMutation = useMutation({
    mutationFn: (file: File) =>
      uploadNutritionPlan(clinic!.id, id!, user!.id, file, setPlanUploadStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(id!) });
      toast.success("Plan alimenticio subido.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el archivo.");
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => {
      const currentPlan = plans.find((plan) => plan.id === planId);
      if (!currentPlan) {
        throw new Error("Plan no encontrado.");
      }

      return deleteNutritionPlan(planId, currentPlan.storagePath);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(id!) });
      toast.success("Plan alimenticio eliminado.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el plan.");
    },
  });

  const uploadStudyMutation = useMutation({
    mutationFn: (file: File) =>
      uploadMedicalStudy(clinic!.id, id!, user!.id, file, setStudyUploadStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(id!) });
      toast.success("Estudio medico subido.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el archivo.");
    },
  });

  const deleteStudyMutation = useMutation({
    mutationFn: (studyId: string) => {
      const currentStudy = studies.find((study) => study.id === studyId);
      if (!currentStudy) {
        throw new Error("Estudio no encontrado.");
      }

      return deleteMedicalStudy(studyId, currentStudy.storagePath);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(id!) });
      toast.success("Estudio medico eliminado.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el estudio.");
    },
  });

  const patientFormValues = useMemo<PatientFormValues | undefined>(() => {
    if (!patient) return undefined;
    return {
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: patient.birthDate ?? "",
      profession: patient.profession ?? "",
      email: patient.email ?? "",
      phone: patient.phone ?? "",
      alerts: patient.alerts.join("\n"),
      status: patient.status,
    };
  }, [patient]);

  const isLoading = patientDetailQuery.isLoading;

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

  if (patientDetailQuery.isError) {
    return (
      <AppLayout>
        <div className="px-4 py-12 text-center text-destructive md:px-8">
          <p className="text-sm">
            {patientDetailQuery.error instanceof Error
              ? patientDetailQuery.error.message
              : "No se pudo cargar la ficha del paciente."}
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="px-4 py-12 text-center text-muted-foreground md:px-8">
          <p className="text-sm">Paciente no encontrado.</p>
          <Link to="/patients" className="mt-2 inline-block text-sm text-primary underline">
            Volver a pacientes
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <Link
          to="/patients"
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Todos los pacientes
        </Link>

        <div className="mb-6 rounded-[34px] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,228,0.94),rgba(243,238,211,0.96))] p-6 shadow-soft md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-border/70 bg-background/80 text-xl font-bold text-secondary-foreground">
                {getInitials(patient.firstName, patient.lastName)}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary/70">
                  Ficha clinica
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold leading-none text-card-foreground">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {patient.age !== null ? `${patient.age} anos` : "Edad sin cargar"} ·{" "}
                  {patient.profession ?? "Profesion sin cargar"} ·{" "}
                  <span
                    className={
                      patient.status === "active" ? "text-success" : "text-muted-foreground"
                    }
                  >
                    {patient.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Alta: {formatDate(patient.createdAt)}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {patient.email ?? "Sin email"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {patient.phone ?? "Sin telefono"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setPatientDialogOpen(true)}
                className="rounded-full border border-border/80 bg-background/70 px-5 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
              >
                <Pencil className="mr-1.5 inline h-3.5 w-3.5" />
                Editar ficha
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="rounded-full border border-destructive/20 bg-destructive/5 px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                    <Trash2 className="mr-1.5 inline h-3.5 w-3.5" />
                    Eliminar paciente
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar paciente</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta accion elimina la ficha del paciente y sus registros asociados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void deletePatientMutation.mutateAsync()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <section className="rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,228,0.92),rgba(243,238,211,0.94))] p-6 shadow-soft md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-destructive/20 bg-destructive/10">
                <TriangleAlert className="h-4.5 w-4.5 text-destructive" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold leading-none text-card-foreground">
                  Alertas del paciente
                </h3>
                <p className="text-xs text-muted-foreground">
                  Se editan desde la ficha general del paciente.
                </p>
              </div>
            </div>

            {patient.alerts.length === 0 ? (
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground">
                No hay alertas cargadas para este paciente.
              </div>
            ) : (
              <ul className="space-y-3">
                {patient.alerts.map((alert) => (
                  <li
                    key={alert}
                    className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-destructive" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,228,0.92),rgba(243,238,211,0.94))] p-6 shadow-soft md:p-8">
            <h3 className="font-display text-2xl font-semibold leading-none text-card-foreground">
              Ultimo turno
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Solo referencia. No se agenda desde esta vista.
            </p>

            {lastAppointment ? (
              <div className="mt-5 space-y-3 rounded-[24px] border border-border/60 bg-background/75 p-4">
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {lastAppointment.appointmentType}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(lastAppointment.startsAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-sm text-muted-foreground">
                  Estado: {lastAppointment.status}
                </div>
                {lastAppointment.notes ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {lastAppointment.notes}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground">
                Todavia no hay turnos registrados.
              </div>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="space-y-6">
            <ConsultationsSection
              currentProfessionalProfile={currentProfessionalProfile}
              consultations={consultations}
              isSavingConsultation={createConsultationMutation.isPending}
              onCreateConsultation={createConsultationMutation.mutateAsync}
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
              uploadStatusLabel={planUploadStatus ?? undefined}
              emptyMessage="Sin planes cargados todavia"
              accept=".pdf,application/pdf"
              isUploading={uploadPlanMutation.isPending}
              onUpload={uploadPlanMutation.mutateAsync}
              onDownload={handleDownloadPlan}
              onDelete={deletePlanMutation.mutateAsync}
            />

            <FileList
              title="Estudios medicos"
              items={studies.map((study) => ({
                id: study.id,
                title: study.title,
                date: study.studyDate,
                fileType: study.fileType,
              }))}
              uploadLabel="Subir estudio"
              uploadStatusLabel={studyUploadStatus ?? undefined}
              emptyMessage="Sin estudios cargados todavia"
              accept=".pdf,image/*"
              isUploading={uploadStudyMutation.isPending}
              onUpload={uploadStudyMutation.mutateAsync}
              onDownload={handleDownloadStudy}
              onDelete={deleteStudyMutation.mutateAsync}
            />

            <NotesSection
              notes={notes}
              isSaving={createNoteMutation.isPending}
              onCreateNote={createNoteMutation.mutateAsync}
              onDeleteNote={deleteNoteMutation.mutateAsync}
            />
          </div>
        </div>

        <PatientFormDialog
          open={patientDialogOpen}
          onOpenChange={setPatientDialogOpen}
          title="Editar paciente"
          description="Actualiza datos generales y alertas visibles del paciente."
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
