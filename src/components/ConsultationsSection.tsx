import { useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";
import type {
  ConsultationCriterionFormValue,
  PatientConsultation,
  PatientConsultationFormValues,
  ProfessionalProfile,
} from "@/types/domain";

interface ConsultationsSectionProps {
  currentProfessionalProfile: ProfessionalProfile | null;
  consultations: PatientConsultation[];
  isSavingConsultation?: boolean;
  onCreateConsultation: (values: PatientConsultationFormValues) => Promise<void>;
}

const BULLET = "\u2022 ";

function createEmptyCriterion(): ConsultationCriterionFormValue {
  return {
    id: crypto.randomUUID(),
    label: "",
    content: "",
  };
}

function normalizeBulletList(value: string) {
  if (!value.trim()) return "";

  return value
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^(?:\u2022|-|\*)\s*/, "").trim())
    .filter(Boolean)
    .map((line) => `${BULLET}${line}`)
    .join("\n");
}

function parseBulletList(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^(?:\u2022|-|\*)\s*/, "").trim())
    .filter(Boolean);
}

function formatProfessionalSignature(profile: ProfessionalProfile | null) {
  if (!profile) {
    return "Profesional del equipo";
  }

  const displayName =
    profile.professionalTitle.trim() ||
    profile.fullName.trim() ||
    profile.email.trim() ||
    "Profesional del equipo";
  const specialty = profile.specialty.trim();

  return specialty ? `${displayName} (${specialty})` : displayName;
}

function formatConsultationSignature(consultation: PatientConsultation) {
  const displayName =
    consultation.authorProfessionalTitle.trim() ||
    consultation.authorName.trim() ||
    "Profesional del equipo";
  const specialty = consultation.authorSpecialty.trim();

  return specialty ? `${displayName} (${specialty})` : displayName;
}

export default function ConsultationsSection({
  currentProfessionalProfile,
  consultations,
  isSavingConsultation = false,
  onCreateConsultation,
}: ConsultationsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<PatientConsultationFormValues>({
    consultationType: "",
    notes: "",
    criteria: [],
  });

  const professionalSignature = useMemo(() => {
    return formatProfessionalSignature(currentProfessionalProfile);
  }, [currentProfessionalProfile]);

  const handleCriterionChange = (
    criterionId: string,
    key: keyof ConsultationCriterionFormValue,
    value: string,
  ) => {
    setFormValues((current) => ({
      ...current,
      criteria: current.criteria.map((criterion) =>
        criterion.id === criterionId ? { ...criterion, [key]: value } : criterion,
      ),
    }));
  };

  const handleCriterionBlur = (criterionId: string) => {
    const criterion = formValues.criteria.find((entry) => entry.id === criterionId);
    if (!criterion) return;

    handleCriterionChange(criterionId, "content", normalizeBulletList(criterion.content));
  };

  const handleAddCriterion = () => {
    setFormValues((current) => ({
      ...current,
      criteria: [...current.criteria, createEmptyCriterion()],
    }));
  };

  const handleRemoveCriterion = (criterionId: string) => {
    setFormValues((current) => ({
      ...current,
      criteria: current.criteria.filter((criterion) => criterion.id !== criterionId),
    }));
  };

  const resetForm = () => {
    setFormValues({
      consultationType: "",
      notes: "",
      criteria: [],
    });
  };

  const handleCreateConsultation = async () => {
    const payload = {
      consultationType: formValues.consultationType.trim(),
      notes: formValues.notes.trim(),
      criteria: formValues.criteria.map((criterion) => ({
        ...criterion,
        label: criterion.label.trim(),
        content: normalizeBulletList(criterion.content),
      })),
    };

    await onCreateConsultation(payload);
    resetForm();
    setDialogOpen(false);
  };

  return (
    <section className="rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,228,0.92),rgba(243,238,211,0.94))] p-5 shadow-soft md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-border/70 bg-background/80">
            <ClipboardList className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-semibold leading-none text-card-foreground">
              Consultas
            </h3>
            <p className="text-xs text-muted-foreground">
              Cada evolucion queda firmada por profesional y fecha.
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-primary/75">
              {professionalSignature}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-border/80 bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
          Nueva consulta
        </button>
      </div>

      <div className="space-y-5">
        {consultations.map((consultation) => (
          <article
            key={consultation.id}
            className="overflow-hidden rounded-[24px] border border-border/60 bg-background/72 shadow-[0_10px_28px_rgba(76,70,43,0.06)]"
          >
            <div className="flex flex-col gap-3 border-b border-border/60 bg-[rgba(196,228,243,0.72)] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {formatDateTime(consultation.consultedAt)} -{" "}
                  {formatConsultationSignature(consultation)}
                </p>
              </div>
              <div className="self-start rounded-full border border-white/70 bg-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-card-foreground">
                {consultation.consultationType || "Consulta"}
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              {consultation.criteria.map((criterion) => (
                <div key={criterion.id}>
                  <p className="mb-2 text-sm font-semibold text-card-foreground">
                    {criterion.label}:
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                    {parseBulletList(criterion.content).map((line) => (
                      <li key={`${criterion.id}-${line}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {consultation.notes ? (
                <div>
                  <p className="mb-2 text-sm font-semibold text-card-foreground">Detalle:</p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {consultation.notes}
                  </p>
                </div>
              ) : null}
            </div>
          </article>
        ))}

        {consultations.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-5 text-sm text-muted-foreground">
            Aun no hay consultas cargadas para este paciente.
          </div>
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-hidden p-0">
          <div className="flex max-h-[88vh] flex-col">
            <DialogHeader className="shrink-0 border-b border-border/60 px-6 pb-4 pt-6">
              <DialogTitle>Nueva consulta</DialogTitle>
              <DialogDescription>
                La consulta se guardara firmada como {professionalSignature}. Agrega un tipo,
                criterios y un detalle libre si lo necesitas.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Tipo de consulta
                  </label>
                  <input
                    value={formValues.consultationType}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        consultationType: event.target.value,
                      }))
                    }
                    placeholder="Ej. Primera consulta, Seguimiento, Control"
                    className="crm-input"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar criterio
                  </button>
                </div>

                {formValues.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="rounded-[20px] border border-border/55 bg-card/70 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <input
                        value={criterion.label}
                        onChange={(event) =>
                          handleCriterionChange(criterion.id, "label", event.target.value)
                        }
                        placeholder="Ej. Actividad fisica"
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-ring/30"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(criterion.id)}
                        className="rounded-full border border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-accent"
                      >
                        Quitar
                      </button>
                    </div>

                    <textarea
                      value={criterion.content}
                      onChange={(event) =>
                        handleCriterionChange(criterion.id, "content", event.target.value)
                      }
                      onBlur={() => handleCriterionBlur(criterion.id)}
                      placeholder="• "
                      rows={4}
                      className="max-h-44 min-h-[8.5rem] w-full overflow-y-auto rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                ))}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Notas / detalle
                  </label>
                  <textarea
                    value={formValues.notes}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Agrega detalles libres de la consulta..."
                    rows={6}
                    className="max-h-56 min-h-[10rem] w-full overflow-y-auto rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border/60 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setDialogOpen(false);
                }}
                className="rounded-full border border-border/80 bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleCreateConsultation()}
                disabled={
                  isSavingConsultation ||
                  (!formValues.consultationType.trim() &&
                    !formValues.notes.trim() &&
                    formValues.criteria.every(
                      (criterion) =>
                        !criterion.label.trim() && !criterion.content.trim(),
                    ))
                }
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingConsultation ? "Guardando..." : "Guardar consulta"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
