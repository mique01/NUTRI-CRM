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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
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
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
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
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
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
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
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
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
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
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
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
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
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
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
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
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : submitLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
