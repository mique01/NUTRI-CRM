import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  emptyPatientFormValues,
  type PatientFormValues,
} from "@/types/domain";

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: PatientFormValues;
  isSubmitting?: boolean;
  onSubmit: (values: PatientFormValues) => Promise<void>;
}

export default function PatientFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValues,
  isSubmitting = false,
  onSubmit,
}: PatientFormDialogProps) {
  const [formValues, setFormValues] = useState<PatientFormValues>(
    initialValues ?? emptyPatientFormValues,
  );

  useEffect(() => {
    if (open) {
      setFormValues(initialValues ?? emptyPatientFormValues);
    }
  }, [initialValues, open]);

  const handleChange = (field: keyof PatientFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-[30px] border-border/70 bg-[linear-gradient(180deg,rgba(252,249,228,0.97),rgba(244,238,210,0.96))] p-7">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Nombre
              </label>
              <input
                value={formValues.firstName}
                onChange={(event) => handleChange("firstName", event.target.value)}
                required
                className="crm-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Apellido
              </label>
              <input
                value={formValues.lastName}
                onChange={(event) => handleChange("lastName", event.target.value)}
                required
                className="crm-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={formValues.birthDate}
                onChange={(event) => handleChange("birthDate", event.target.value)}
                className="crm-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Profesión
              </label>
              <input
                value={formValues.profession}
                onChange={(event) => handleChange("profession", event.target.value)}
                placeholder="Ej. Abogada"
                className="crm-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                value={formValues.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="paciente@email.com"
                className="crm-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Teléfono
              </label>
              <input
                value={formValues.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                placeholder="+54 11 ..."
                className="crm-input"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Estado
            </label>
            <select
              value={formValues.status}
              onChange={(event) => handleChange("status", event.target.value)}
              className="crm-input"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Alertas del paciente
            </label>
            <textarea
              value={formValues.alerts}
              onChange={(event) => handleChange("alerts", event.target.value)}
              rows={4}
              placeholder={"Una alerta por linea\nEj. Hipotiroidismo\nEj. Alergia a frutos secos"}
              className="crm-input min-h-[128px] p-4"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-border/80 bg-background/70 px-5 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : submitLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
