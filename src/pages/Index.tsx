import AppLayout from "@/components/AppLayout";
import { useDashboardConsultationsQuery } from "@/hooks/use-crm-data";
import { cn, formatDate } from "@/lib/utils";

function getCalendarDays(referenceDate: Date) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  const startDay = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const previousMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
  const days = [];

  for (let index = startDay - 1; index >= 0; index -= 1) {
    days.push({
      date: new Date(previousMonth.getFullYear(), previousMonth.getMonth(), previousMonth.getDate() - index),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: new Date(referenceDate.getFullYear(), referenceDate.getMonth(), day),
      isCurrentMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - (startDay + daysInMonth) + 1;
    days.push({
      date: new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, nextDay),
      isCurrentMonth: false,
    });
  }

  return days;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

const weekDayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const Home = () => {
  const consultationsQuery = useDashboardConsultationsQuery();
  const today = new Date();
  const monthLabel = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(today);

  const calendarDays = getCalendarDays(today);
  const consultations = consultationsQuery.data ?? [];
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const consultationsThisWeek = consultations.filter((consultation) => {
    const date = new Date(consultation.startsAt);
    return date >= weekStart && date < weekEnd;
  });

  const consultationDays = new Set(
    consultations.map((consultation) => new Date(consultation.startsAt).toDateString()),
  );

  return (
    <AppLayout>
      <div className="max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Inicio
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Panorama del consultorio
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_320px]">
          <section className="rounded-[30px] border border-border bg-card p-5 shadow-card md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold capitalize text-card-foreground">
                  {monthLabel}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vista compacta del mes. Mas adelante esta tarjeta se reemplaza por Google Calendar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {weekDayLabels.map((label) => (
                <span key={label} className="py-2">
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarDays.map(({ date, isCurrentMonth }) => {
                const hasConsultation = consultationDays.has(date.toDateString());
                const isToday = isSameDay(date, today);

                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      "flex aspect-square min-h-[58px] flex-col items-center justify-center rounded-2xl border text-sm transition-colors",
                      isCurrentMonth
                        ? "border-border bg-background text-foreground"
                        : "border-border/50 bg-muted/30 text-muted-foreground",
                      isToday && "border-primary/40 bg-primary/10",
                    )}
                  >
                    <span className="font-medium">{date.getDate()}</span>
                    <span
                      className={cn(
                        "mt-2 inline-block h-2.5 w-2.5 rounded-full",
                        hasConsultation ? "bg-primary" : "bg-transparent",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-border bg-card p-5 shadow-card md:p-6">
            <h3 className="text-2xl font-semibold text-card-foreground">
              Consultas esta semana
            </h3>

            <div className="mt-5 space-y-4">
              {consultationsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando consultas...</p>
              ) : consultationsThisWeek.length === 0 ? (
                <div className="rounded-2xl bg-muted px-4 py-5 text-sm text-muted-foreground">
                  No hay consultas registradas esta semana.
                </div>
              ) : (
                consultationsThisWeek.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="rounded-[24px] border border-border bg-background p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-card-foreground">
                          {consultation.patientName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(consultation.startsAt, {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "mt-1 inline-block h-2.5 w-2.5 rounded-full",
                          consultation.status === "completed"
                            ? "bg-success"
                            : consultation.status === "scheduled"
                              ? "bg-primary"
                              : "bg-muted-foreground/40",
                        )}
                      />
                    </div>
                    <div className="mt-4 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                      Estado: {consultation.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
