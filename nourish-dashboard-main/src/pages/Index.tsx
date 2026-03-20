import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import InviteTeammateCard from "@/components/InviteTeammateCard";
import PatientCard from "@/components/PatientCard";
import PatientCardSkeleton from "@/components/PatientCardSkeleton";
import PatientFormDialog from "@/components/PatientFormDialog";
import { useAuth } from "@/context/AuthContext";
import { usePatientsQuery } from "@/hooks/use-crm-data";
import { queryKeys } from "@/lib/queryKeys";
import { createClinicInvite } from "@/services/clinic";
import { createPatient } from "@/services/patients";
import type { PatientFormValues } from "@/types/domain";

const Dashboard = () => {
  const { clinic, membership, user } = useAuth();
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

  const inviteMutation = useMutation({
    mutationFn: createClinicInvite,
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo generar la invitación.",
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

  return (
    <AppLayout>
      <div className="max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 md:mb-8">
          <h2 className="mb-1 text-2xl font-bold text-foreground">Pacientes</h2>
          <p className="text-sm text-muted-foreground">
            {patients.length} pacientes · {activePatients.length} activos
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar pacientes..."
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <button
            onClick={() => setPatientDialogOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nuevo paciente
          </button>
        </div>

        {membership?.role === "admin" ? (
          <div className="mb-6">
            <InviteTeammateCard onCreateInvite={inviteMutation.mutateAsync} />
          </div>
        ) : null}

        {patientsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="py-16 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">No se encontraron pacientes</p>
            <p className="mt-1 text-xs">Probá con otro término de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient, index) => (
              <div
                key={patient.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
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
          description="Cargá los datos generales para empezar a trabajar su ficha clínica."
          submitLabel="Crear paciente"
          isSubmitting={createPatientMutation.isPending}
          onSubmit={createPatientMutation.mutateAsync}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
