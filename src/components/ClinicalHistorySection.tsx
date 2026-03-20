import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { ClipboardList } from "lucide-react";
import type { ClinicalHistory, ClinicalHistoryFormValues } from "@/types/domain";

interface ClinicalHistorySectionProps {
  history: ClinicalHistory | undefined;
  isSaving?: boolean;
  onSave: (values: ClinicalHistoryFormValues) => Promise<void>;
}

const fields: Array<{
  key: keyof ClinicalHistoryFormValues;
  label: string;
  placeholder: string;
}> = [
  { key: "consultationReason", label: "Motivo de consulta", placeholder: "• " },
  { key: "objective", label: "Objetivo", placeholder: "• " },
  {
    key: "pathologiesHistorySurgeries",
    label: "Patologias, antecedentes y cirugias",
    placeholder: "• ",
  },
  {
    key: "medicationsSupplements",
    label: "Medicamentos y suplementos",
    placeholder: "• ",
  },
  { key: "eatingHabits", label: "Habitos alimentarios", placeholder: "• " },
  { key: "allergiesIntolerances", label: "Alergias e intolerancias", placeholder: "• " },
  { key: "physicalActivity", label: "Actividad fisica", placeholder: "• " },
  { key: "stress", label: "Estres", placeholder: "• " },
  { key: "sleep", label: "Descanso", placeholder: "• " },
  { key: "digestiveSystem", label: "Sistema digestivo", placeholder: "• " },
  { key: "menstrualCycles", label: "Ciclos menstruales", placeholder: "• " },
  { key: "otherObservations", label: "Otras observaciones", placeholder: "• " },
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

function ensureBulletPrefix(value: string) {
  if (!value.trim()) return "";

  return value
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "";
      return line.trimStart().startsWith("•") ? line : `• ${line.trim()}`;
    })
    .join("\n");
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

  const handleKeyDown = (
    field: keyof ClinicalHistoryFormValues,
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const currentValue = formValues[field];
    const insertValue = "\n• ";
    const nextValue =
      currentValue.slice(0, start) + insertValue + currentValue.slice(end);

    handleChange(field, nextValue);

    window.requestAnimationFrame(() => {
      target.selectionStart = start + insertValue.length;
      target.selectionEnd = start + insertValue.length;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const sanitized = Object.fromEntries(
      Object.entries(formValues).map(([key, value]) => [key, ensureBulletPrefix(value)]),
    ) as ClinicalHistoryFormValues;

    setFormValues(sanitized);
    await onSave(sanitized);
  };

  return (
    <section className="rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
          <ClipboardList className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground">Historia clinica</h3>
          <p className="text-xs text-muted-foreground">
            Cada bloque funciona como lista. Al presionar Enter se agrega un bullet nuevo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((field) => (
          <div key={field.key} className="border-b border-border/70 pb-4 last:border-b-0">
            <label className="mb-2 block text-sm font-semibold text-foreground">
              {field.label}
            </label>
            <textarea
              value={formValues[field.key]}
              onChange={(event) => handleChange(field.key, event.target.value)}
              onKeyDown={(event) => handleKeyDown(field.key, event)}
              placeholder={field.placeholder}
              rows={Math.max(2, (formValues[field.key].match(/\n/g)?.length ?? 0) + 2)}
              className="w-full resize-none border-0 bg-transparent px-0 py-0 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
            />
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar historia clinica"}
          </button>
        </div>
      </form>
    </section>
  );
}
