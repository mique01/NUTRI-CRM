import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Calendar, Clock, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  emptyAppointmentFormValues,
  type Appointment,
  type AppointmentFormValues,
} from "@/types/domain";
import {
  formatDateTime,
  toLocalDateInputValue,
  toLocalTimeInputValue,
} from "@/lib/utils";

interface AppointmentCardProps {
  appointments: Appointment[];
  isSaving?: boolean;
  onSave: (values: AppointmentFormValues, appointmentId?: string) => Promise<void>;
}

function getFormValues(appointment?: Appointment | null): AppointmentFormValues {
  if (!appointment) return emptyAppointmentFormValues;

  const durationMinutes = Math.max(
    Math.round(
      (new Date(appointment.endsAt).getTime() -
        new Date(appointment.startsAt).getTime()) /
        60_000,
    ),
    15,
  );

  return {
    date: toLocalDateInputValue(appointment.startsAt),
    time: toLocalTimeInputValue(appointment.startsAt),
    durationMinutes,
    appointmentType: appointment.appointmentType,
    notes: appointment.notes,
    status: appointment.status,
  };
}

const AppointmentCard = ({
  appointments,
  isSaving = false,
  onSave,
}: AppointmentCardProps) => {
  const [open, setOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AppointmentFormValues>(
    emptyAppointmentFormValues,
  );

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      ),
    [appointments],
  );

  const upcomingAppointment =
    sortedAppointments.find(
      (appointment) =>
        appointment.status === "scheduled" &&
        new Date(appointment.startsAt).getTime() >= Date.now(),
    ) ?? null;

  useEffect(() => {
    if (!open) return;
    const editingAppointment = sortedAppointments.find(
      (appointment) => appointment.id === editingAppointmentId,
    );
    setFormValues(getFormValues(editingAppointment ?? upcomingAppointment));
  }, [editingAppointmentId, open, sortedAppointments, upcomingAppointment]);

  const openCreateDialog = () => {
    setEditingAppointmentId(null);
    setFormValues(
      upcomingAppointment ? getFormValues(upcomingAppointment) : emptyAppointmentFormValues,
    );
    setOpen(true);
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setFormValues(getFormValues(appointment));
    setOpen(true);
  };

  const handleChange = (field: keyof AppointmentFormValues, value: string) => {
    setFormValues((current) => ({
      ...current,
      [field]: field === "durationMinutes" ? Number(value || "0") : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(formValues, editingAppointmentId ?? undefined);
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">Agenda del paciente</h3>
        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {upcomingAppointment ? upcomingAppointment.appointmentType : "Sin turno"}
        </span>
      </div>

      {upcomingAppointment ? (
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono-app">{formatDateTime(upcomingAppointment.startsAt)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono-app">
              {Math.round(
                (new Date(upcomingAppointment.endsAt).getTime() -
                  new Date(upcomingAppointment.startsAt).getTime()) /
                  60_000,
              )}{" "}
              min
            </span>
          </div>
          {upcomingAppointment.notes ? (
            <p className="pl-7 text-sm text-muted-foreground">
              {upcomingAppointment.notes}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mb-5 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Sin turnos próximos cargados.
        </div>
      )}

      {sortedAppointments.length > 0 ? (
        <div className="mb-4 space-y-2">
          {sortedAppointments.slice(0, 4).map((appointment) => (
            <button
              key={appointment.id}
              onClick={() => openEditDialog(appointment)}
              className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 text-left transition-colors hover:bg-secondary"
            >
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  {appointment.appointmentType}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(appointment.startsAt)}
                </p>
              </div>
              <span className="rounded-lg bg-background px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                {appointment.status}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <button
        onClick={() =>
          upcomingAppointment ? openEditDialog(upcomingAppointment) : openCreateDialog()
        }
        className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent active:scale-[0.98]"
      >
        <Pencil className="mr-2 inline h-3.5 w-3.5" />
        {upcomingAppointment ? "Editar próximo turno" : "Agendar turno"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAppointmentId ? "Editar turno" : "Agendar turno"}
            </DialogTitle>
            <DialogDescription>
              La estructura ya queda preparada para sincronizar con Google Calendar más adelante.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={formValues.date}
                  onChange={(event) => handleChange("date", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Hora
                </label>
                <input
                  type="time"
                  required
                  value={formValues.time}
                  onChange={(event) => handleChange("time", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Tipo
                </label>
                <input
                  required
                  value={formValues.appointmentType}
                  onChange={(event) => handleChange("appointmentType", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  required
                  value={formValues.durationMinutes}
                  onChange={(event) => handleChange("durationMinutes", event.target.value)}
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
                <option value="scheduled">Programado</option>
                <option value="completed">Realizado</option>
                <option value="cancelled">Cancelado</option>
                <option value="no_show">Ausente</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Notas del turno
              </label>
              <textarea
                value={formValues.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground"
              />
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : "Guardar turno"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentCard;
