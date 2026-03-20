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
      <div className="max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Pacientes
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Seguimiento clinico
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {patients.length} pacientes, {activePatients.length} activos y{" "}
              {alertedPatients.length} con alertas visibles.
            </p>
          </div>

          <button
            onClick={() => setPatientDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nuevo paciente
          </button>
        </div>

        <div className="mb-6 rounded-[28px] border border-border bg-card p-4 shadow-card md:p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar pacientes por nombre..."
              className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>

        {patientsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <PatientCardSkeleton key={index} />
            ))}
          </div>
        ) : patientsQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            {patientsQuery.error instanceof Error
              ? patientsQuery.error.message
              : "No se pudieron cargar los pacientes."}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-[28px] border border-border bg-card py-16 text-center text-muted-foreground shadow-card">
            <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">No se encontraron pacientes</p>
            <p className="mt-1 text-xs">Proba con otro termino de busqueda</p>
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
