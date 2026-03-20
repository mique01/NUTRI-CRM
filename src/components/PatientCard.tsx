import { Calendar, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate, getInitials } from "@/lib/utils";
import type { Patient } from "@/types/domain";

interface PatientCardProps {
  patient: Patient;
}

const PatientCard = ({ patient }: PatientCardProps) => {
  return (
    <Link
      to={`/patients/${patient.id}`}
      className="group block rounded-[26px] border border-border bg-card p-5 shadow-card transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover active:scale-[0.98]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-sm font-semibold text-secondary-foreground">
            {getInitials(patient.firstName, patient.lastName)}
          </div>
          <div>
            <h3 className="font-semibold leading-tight text-card-foreground">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {patient.age !== null
                ? `${patient.age} anos`
                : patient.profession ?? "Sin edad cargada"}
            </p>
          </div>
        </div>

        <span
          className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${
            patient.status === "active" ? "bg-success" : "bg-muted-foreground/30"
          }`}
          title={patient.status === "active" ? "Activo" : "Inactivo"}
        />
      </div>

      {patient.alerts.length > 0 ? (
        <div className="mb-4 space-y-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-destructive">
            <TriangleAlert className="h-3.5 w-3.5" />
            Alertas
          </div>
          <ul className="space-y-1">
            {patient.alerts.slice(0, 3).map((alert) => (
              <li key={alert} className="flex items-start gap-2 text-sm text-destructive">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-destructive" />
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-3 text-sm text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span className="text-xs">
          {patient.lastAppointmentAt
            ? `Ultimo turno: ${formatDate(patient.lastAppointmentAt)}`
            : "Sin turnos registrados"}
        </span>
      </div>
    </Link>
  );
};

export default PatientCard;
