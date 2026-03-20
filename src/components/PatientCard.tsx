import { Calendar } from "lucide-react";
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
      className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover active:scale-[0.98]"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground">
            {getInitials(patient.firstName, patient.lastName)}
          </div>
          <div>
            <h3 className="leading-tight text-card-foreground font-semibold">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {patient.age !== null
                ? `${patient.age} años`
                : patient.profession ?? "Sin edad cargada"}
            </p>
          </div>
        </div>
        <span
          className={`mt-1.5 inline-block h-2.5 w-2.5 rounded-full ${
            patient.status === "active" ? "bg-success" : "bg-muted-foreground/30"
          }`}
          title={patient.status === "active" ? "Activo" : "Inactivo"}
        />
      </div>

      {patient.nextAppointmentAt ? (
        <div className="flex items-center gap-2 rounded-lg bg-primary/8 px-3 py-2 text-sm text-primary">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-mono-app text-xs font-medium">
            {formatDate(patient.nextAppointmentAt)}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-xs">Sin turno próximo</span>
        </div>
      )}
    </Link>
  );
};

export default PatientCard;
