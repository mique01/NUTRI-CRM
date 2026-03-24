import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import PatientCard from "@/components/PatientCard";
import PatientCardSkeleton from "@/components/PatientCardSkeleton";
import PatientFormDialog from "@/components/PatientFormDialog";
import { useAuth } from "@/context/AuthContext";
import { usePatientsQuery } from "@/hooks/use-crm-data";
import { queryKeys } from "@/lib/queryKeys";
import { createPatient } from "@/services/patients";
import type { PatientFormValues } from "@/types/domain";

const Patients = () => {
  const { clinic, user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const patientsQuery = usePatientsQuery();

  const createPatientMutation = useMutation({
    mutationFn: (values: PatientFormValues) =>
      createPatient(clinic!.id, user!.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      setPatientDialogOpen(false);
      toast.success("Paciente creado correctamente.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el paciente.",
      );
    },
  });

  const filteredPatients = useMemo(() => {
    const patients = patientsQuery.data ?? [];
    if (!deferredSearch.trim()) return patients;

    const query = deferredSearch.toLowerCase();
    return patients.filter((patient) =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(query),
    );
  }, [deferredSearch, patientsQuery.data]);

  const patients = patientsQuery.data ?? [];
  const activePatients = patients.filter((patient) => patient.status === "active");
  const alertedPatients = patients.filter((patient) => patient.alerts.length > 0);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary/70">
              Pacientes
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-none tracking-tight text-foreground">
              Seguimiento clinico
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {patients.length} pacientes, {activePatients.length} activos y{" "}
              {alertedPatients.length} con alertas visibles.
            </p>
          </div>

          <button
            onClick={() => setPatientDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nuevo paciente
          </button>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="crm-panel p-4 md:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar pacientes por nombre..."
                className="crm-input pl-14"
              />
            </div>
          </div>

          <div className="crm-panel flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Estado general
              </p>
              <p className="mt-2 font-display text-2xl font-semibold leading-none text-foreground">
                {activePatients.length}
              </p>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Activos
            </div>
          </div>
        </div>

        {patientsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <PatientCardSkeleton key={index} />
            ))}
          </div>
        ) : patientsQuery.isError ? (
          <div className="rounded-[28px] border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            {patientsQuery.error instanceof Error
              ? patientsQuery.error.message
              : "No se pudieron cargar los pacientes."}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-[28px] border border-border/80 bg-card/70 py-16 text-center text-muted-foreground shadow-soft">
            <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="font-display text-2xl font-semibold leading-none text-foreground">
              No se encontraron pacientes
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em]">
              Proba con otro termino de busqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPatients.map((patient, index) => (
              <div
                key={patient.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PatientCard patient={patient} />
              </div>
            ))}
          </div>
        )}

        <PatientFormDialog
          open={patientDialogOpen}
          onOpenChange={setPatientDialogOpen}
          title="Nuevo paciente"
          description="Carga datos generales y alertas clinicas para empezar la ficha."
          submitLabel="Crear paciente"
          isSubmitting={createPatientMutation.isPending}
          onSubmit={createPatientMutation.mutateAsync}
        />
      </div>
    </AppLayout>
  );
};

export default Patients;
