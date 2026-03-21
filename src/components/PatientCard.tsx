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
      className="group block rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,228,0.9),rgba(243,238,211,0.92))] p-5 shadow-[0_14px_28px_rgba(97,90,58,0.10)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_18px_34px_rgba(97,90,58,0.14)] active:scale-[0.98]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-border/60 bg-background/80 text-sm font-semibold text-secondary-foreground">
            {getInitials(patient.firstName, patient.lastName)}
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold leading-none text-card-foreground">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
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
        <div className="mb-4 space-y-2 rounded-[20px] border border-destructive/15 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-destructive">
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

      <div className="flex items-center gap-2 rounded-[20px] border border-border/60 bg-background/70 px-3 py-3 text-sm text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 text-primary/70" />
        <span className="text-xs uppercase tracking-[0.12em]">
          {patient.lastAppointmentAt
            ? `Ultimo turno: ${formatDate(patient.lastAppointmentAt)}`
            : "Sin turnos registrados"}
        </span>
      </div>
    </Link>
  );
};

export default PatientCard;
