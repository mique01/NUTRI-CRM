import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { ClipboardList } from "lucide-react";
import type { ClinicalHistory, ClinicalHistoryFormValues } from "@/types/domain";

interface ClinicalHistorySectionProps {
  history: ClinicalHistory | undefined;
  isSaving?: boolean;
  onSave: (values: ClinicalHistoryFormValues) => Promise<void>;
}

const BULLET = "\u2022 ";

const fields: Array<{
  key: keyof ClinicalHistoryFormValues;
  label: string;
}> = [
  { key: "consultationReason", label: "Motivo de consulta" },
  { key: "objective", label: "Objetivo" },
  { key: "pathologiesHistorySurgeries", label: "Patologias, antecedentes y cirugias" },
  { key: "medicationsSupplements", label: "Medicamentos y suplementos" },
  { key: "eatingHabits", label: "Habitos alimentarios" },
  { key: "allergiesIntolerances", label: "Alergias e intolerancias" },
  { key: "physicalActivity", label: "Actividad fisica" },
  { key: "stress", label: "Estres" },
  { key: "sleep", label: "Descanso" },
  { key: "digestiveSystem", label: "Sistema digestivo" },
  { key: "menstrualCycles", label: "Ciclos menstruales" },
  { key: "otherObservations", label: "Otras observaciones" },
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

function normalizeListValue(value: string) {
  if (!value.trim()) return "";

  return value
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^(?:\u2022|-|\*)\s*/, "").trim())
    .filter(Boolean)
    .map((line) => `${BULLET}${line}`)
    .join("\n");
}

function getRowCount(value: string) {
  const lineCount = value.split("\n").filter((line) => line.trim().length > 0).length;
  return Math.max(1, Math.min(lineCount || 1, 5));
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

  const handleBlur = (field: keyof ClinicalHistoryFormValues) => {
    handleChange(field, normalizeListValue(formValues[field]));
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
    const normalizedCurrentValue = currentValue
      ? currentValue.replace(/\r/g, "")
      : "";
    const insertValue = normalizedCurrentValue.trim() ? `\n${BULLET}` : BULLET;
    const nextValue =
      normalizedCurrentValue.slice(0, start) +
      insertValue +
      normalizedCurrentValue.slice(end);

    handleChange(field, nextValue);

    window.requestAnimationFrame(() => {
      const cursor = start + insertValue.length;
      target.selectionStart = cursor;
      target.selectionEnd = cursor;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const sanitized = Object.fromEntries(
      Object.entries(formValues).map(([key, value]) => [key, normalizeListValue(value)]),
    ) as ClinicalHistoryFormValues;

    setFormValues(sanitized);
    await onSave(sanitized);
  };

  return (
    <section className="rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,228,0.92),rgba(243,238,211,0.94))] p-5 shadow-soft md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-border/70 bg-background/80">
          <ClipboardList className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-display text-3xl font-semibold leading-none text-card-foreground">
            Historia clinica
          </h3>
          <p className="text-xs text-muted-foreground">
            Formato lista. Enter agrega un item nuevo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="rounded-[20px] border border-border/55 bg-background/50 px-4 py-3">
            <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {field.label}
            </label>
            <textarea
              value={formValues[field.key]}
              onChange={(event) => handleChange(field.key, event.target.value)}
              onBlur={() => handleBlur(field.key)}
              onKeyDown={(event) => handleKeyDown(field.key, event)}
              placeholder={BULLET}
              rows={getRowCount(formValues[field.key])}
              className="w-full resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
            />
          </div>
        ))}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar historia clinica"}
          </button>
        </div>
      </form>
    </section>
  );
}
