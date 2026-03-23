import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Save } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type {
  ClinicalHistory,
  ConsultationCriterionFormValue,
  PatientConsultation,
  PatientConsultationFormValues,
  ProfessionalProfile,
} from "@/types/domain";

interface ConsultationsSectionProps {
  currentProfessionalProfile: ProfessionalProfile | null;
  history?: ClinicalHistory;
  consultations: PatientConsultation[];
  isSavingConsultation?: boolean;
  isSavingProfile?: boolean;
  onCreateConsultation: (values: PatientConsultationFormValues) => Promise<void>;
  onSaveProfessionalProfile: (values: {
    professionalTitle: string;
    specialty: string;
  }) => Promise<void>;
}

const BULLET = "\u2022 ";

const historyLabels: Array<{ label: string; value: keyof ClinicalHistory }> = [
  { label: "Motivo de consulta", value: "consultationReason" },
  { label: "Objetivo", value: "objective" },
  { label: "Patologias, antecedentes y cirugias", value: "pathologiesHistorySurgeries" },
  { label: "Medicamentos y suplementos", value: "medicationsSupplements" },
  { label: "Habitos alimentarios", value: "eatingHabits" },
  { label: "Alergias e intolerancias", value: "allergiesIntolerances" },
  { label: "Actividad fisica", value: "physicalActivity" },
  { label: "Estres", value: "stress" },
  { label: "Descanso", value: "sleep" },
  { label: "Sistema digestivo", value: "digestiveSystem" },
  { label: "Ciclos menstruales", value: "menstrualCycles" },
  { label: "Otras observaciones", value: "otherObservations" },
];

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

function buildLegacyCriteria(history?: ClinicalHistory) {
  if (!history) return [];

  return historyLabels
    .map((entry) => ({
      label: entry.label,
      content: history[entry.value],
    }))
    .filter((entry) => entry.content?.trim())
    .map((entry, index) => ({
      id: `legacy-${index}`,
      label: entry.label,
      content: entry.content,
    }));
}

export default function ConsultationsSection({
  currentProfessionalProfile,
  history,
  consultations,
  isSavingConsultation = false,
  isSavingProfile = false,
  onCreateConsultation,
  onSaveProfessionalProfile,
}: ConsultationsSectionProps) {
  const [profileValues, setProfileValues] = useState({
    professionalTitle: currentProfessionalProfile?.professionalTitle ?? "",
    specialty: currentProfessionalProfile?.specialty ?? "",
  });
  const [isNewConsultationOpen, setIsNewConsultationOpen] = useState(
    consultations.length === 0,
  );
  const [formValues, setFormValues] = useState<PatientConsultationFormValues>({
    consultationType: "",
    notes: "",
    criteria: [],
  });

  useEffect(() => {
    setProfileValues({
      professionalTitle: currentProfessionalProfile?.professionalTitle ?? "",
      specialty: currentProfessionalProfile?.specialty ?? "",
    });
  }, [currentProfessionalProfile]);

  const legacyCriteria = useMemo(() => buildLegacyCriteria(history), [history]);

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
    setIsNewConsultationOpen(true);
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

  const handleSaveProfile = async () => {
    await onSaveProfessionalProfile(profileValues);
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
    setFormValues({
      consultationType: "",
      notes: "",
      criteria: [],
    });
    setIsNewConsultationOpen(false);
  };

  const hasLegacyHistory = legacyCriteria.length > 0;

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
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewConsultationOpen((current) => !current)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-border/80 bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
          Nueva consulta
        </button>
      </div>

      <div className="mb-6 rounded-[24px] border border-border/60 bg-background/65 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Firma profesional
            </p>
            <p className="text-xs text-muted-foreground">
              Se usa para firmar cada consulta y seguimiento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSaveProfile()}
            disabled={isSavingProfile}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSavingProfile ? "Guardando..." : "Guardar firma"}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Profesional</label>
            <input
              value={profileValues.professionalTitle}
              onChange={(event) =>
                setProfileValues((current) => ({
                  ...current,
                  professionalTitle: event.target.value,
                }))
              }
              placeholder="Ej. Lic. / Dra. / Dr."
              className="crm-input"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Especialidad</label>
            <input
              value={profileValues.specialty}
              onChange={(event) =>
                setProfileValues((current) => ({
                  ...current,
                  specialty: event.target.value,
                }))
              }
              placeholder="Ej. Nutricion clinica"
              className="crm-input"
            />
          </div>
        </div>
      </div>

      {isNewConsultationOpen ? (
        <div className="mb-6 rounded-[24px] border border-border/60 bg-background/70 p-4">
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
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent"
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
                  rows={Math.max(3, criterion.content.split("\n").length || 3)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-ring/30"
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
                rows={5}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsNewConsultationOpen(false)}
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
        </div>
      ) : null}

      <div className="space-y-4">
        {consultations.map((consultation) => (
          <article
            key={consultation.id}
            className="overflow-hidden rounded-[24px] border border-border/60 bg-background/70 shadow-[0_10px_30px_rgba(76,70,43,0.06)]"
          >
            <div className="flex flex-col gap-2 border-b border-border/60 bg-[rgba(196,228,243,0.7)] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {formatDateTime(consultation.consultedAt)} - {consultation.authorName}
                  {consultation.authorSpecialty
                    ? ` (${consultation.authorSpecialty})`
                    : ""}
                </p>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {consultation.authorProfessionalTitle || "Profesional"} ·{" "}
                  {consultation.consultationType || "Consulta"}
                </p>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              {consultation.consultationType ? (
                <div>
                  <p className="mb-1 text-sm font-semibold text-card-foreground">
                    Tipo de consulta
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {consultation.consultationType}
                  </p>
                </div>
              ) : null}

              {consultation.criteria.map((criterion) => (
                <div key={criterion.id}>
                  <p className="mb-1 text-sm font-semibold uppercase tracking-[0.08em] text-card-foreground">
                    {criterion.label}
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {parseBulletList(criterion.content).map((line) => (
                      <p key={`${criterion.id}-${line}`}>• {line}</p>
                    ))}
                  </div>
                </div>
              ))}

              {consultation.notes ? (
                <div>
                  <p className="mb-1 text-sm font-semibold text-card-foreground">Detalle</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {consultation.notes}
                  </p>
                </div>
              ) : null}
            </div>
          </article>
        ))}

        {hasLegacyHistory ? (
          <article className="overflow-hidden rounded-[24px] border border-border/60 bg-background/70 shadow-[0_10px_30px_rgba(76,70,43,0.06)]">
            <div className="border-b border-border/60 bg-[rgba(251,239,207,0.7)] px-5 py-4">
              <p className="text-sm font-semibold text-card-foreground">
                Historia clinica previa
              </p>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Registro legacy conservado
              </p>
            </div>

            <div className="space-y-4 px-5 py-5">
              {legacyCriteria.map((criterion) => (
                <div key={criterion.id}>
                  <p className="mb-1 text-sm font-semibold uppercase tracking-[0.08em] text-card-foreground">
                    {criterion.label}
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {parseBulletList(criterion.content).map((line) => (
                      <p key={`${criterion.id}-${line}`}>• {line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {consultations.length === 0 && !hasLegacyHistory ? (
          <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-5 text-sm text-muted-foreground">
            Aun no hay consultas cargadas para este paciente.
          </div>
        ) : null}
      </div>
    </section>
  );
}
