import { useEffect, useState, type FormEvent } from "react";
import { ClipboardList } from "lucide-react";
import type {
  ClinicalHistory,
  ClinicalHistoryFormValues,
} from "@/types/domain";

interface ClinicalHistorySectionProps {
  history: ClinicalHistory | undefined;
  isSaving?: boolean;
  onSave: (values: ClinicalHistoryFormValues) => Promise<void>;
}

const fields: Array<{
  key: keyof ClinicalHistoryFormValues;
  label: string;
  rows?: number;
}> = [
  { key: "consultationReason", label: "Motivo de consulta" },
  { key: "objective", label: "Objetivo" },
  {
    key: "pathologiesHistorySurgeries",
    label: "Patologías, antecedentes y cirugías",
  },
  { key: "medicationsSupplements", label: "Medicamentos y suplementos" },
  { key: "eatingHabits", label: "Hábitos alimentarios" },
  { key: "allergiesIntolerances", label: "Alergias e intolerancias" },
  { key: "physicalActivity", label: "Actividad física" },
  { key: "stress", label: "Estrés" },
  { key: "sleep", label: "Descanso" },
  { key: "digestiveSystem", label: "Sistema digestivo" },
  { key: "menstrualCycles", label: "Ciclos menstruales" },
  { key: "otherObservations", label: "Otras observaciones", rows: 4 },
];

function toFormValues(history?: ClinicalHistory): ClinicalHistoryFormValues {
  return {
    consultationReason: history?.consultationReason ?? "",
    objective: history?.objective ?? "",
    pathologiesHistorySurgeries: history?.pathologiesHistorySurgeries ?? "",
    medicationsSupplements: history?.medicationsSupplements ?? "",
    eatingHabits: history?.eatingHabits ?? "",
    allergiesIntolerances: history?.allergiesIntolerances ?? "",
    physicalActivity: history?.physicalActivity ?? "",
    stress: history?.stress ?? "",
    sleep: history?.sleep ?? "",
    digestiveSystem: history?.digestiveSystem ?? "",
    menstrualCycles: history?.menstrualCycles ?? "",
    otherObservations: history?.otherObservations ?? "",
  };
}

export default function ClinicalHistorySection({
  history,
  isSaving = false,
  onSave,
}: ClinicalHistorySectionProps) {
  const [formValues, setFormValues] = useState<ClinicalHistoryFormValues>(
    toFormValues(history),
  );

  useEffect(() => {
    setFormValues(toFormValues(history));
  }, [history]);

  const handleChange = (field: keyof ClinicalHistoryFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(formValues);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <ClipboardList className="h-4.5 w-4.5 text-muted-foreground" />
        <div>
          <h3 className="font-semibold text-card-foreground">Historia clínica</h3>
          <p className="text-xs text-muted-foreground">
            Ficha estructurada editable del paciente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.key}
              className={field.key === "otherObservations" ? "md:col-span-2" : ""}
            >
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {field.label}
              </label>
              <textarea
                value={formValues[field.key]}
                onChange={(event) => handleChange(field.key, event.target.value)}
                rows={field.rows ?? 3}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar historia clínica"}
          </button>
        </div>
      </form>
    </section>
  );
}
