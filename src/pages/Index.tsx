import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      date: new Date(
        previousMonth.getFullYear(),
        previousMonth.getMonth(),
        previousMonth.getDate() - index,
      ),
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

function chunkWeeks<T>(items: T[], size: number) {
  const weeks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    weeks.push(items.slice(index, index + size));
  }

  return weeks;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

const weekDayLabels = ["L", "M", "M", "J", "V", "S", "D"];

const Home = () => {
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const consultationsQuery = useDashboardConsultationsQuery(visibleMonth);

  useEffect(() => {
    setSelectedDate((current) => {
      if (
        current.getFullYear() === visibleMonth.getFullYear() &&
        current.getMonth() === visibleMonth.getMonth()
      ) {
        return current;
      }

      return new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    });
  }, [visibleMonth]);

  const monthLabel = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  const calendarDays = getCalendarDays(visibleMonth);
  const weekRows = chunkWeeks(calendarDays, 7);
  const consultations = consultationsQuery.data ?? [];

  const consultationsByDay = useMemo(() => {
    const counts = new Map<string, number>();

    consultations.forEach((consultation) => {
      const key = new Date(consultation.startsAt).toDateString();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [consultations]);

  const selectedDayConsultations = useMemo(
    () =>
      consultations
        .filter((consultation) => isSameDay(new Date(consultation.startsAt), selectedDate))
        .sort(
          (left, right) =>
            new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
        ),
    [consultations, selectedDate],
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <section className="rounded-[34px] border border-border bg-card p-5 shadow-card md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
                  )
                }
                className="flex h-14 w-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <div className="text-center">
                <h3 className="text-2xl font-semibold capitalize tracking-tight text-card-foreground">
                  {monthLabel}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Calendario interno del CRM
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
                  )
                }
                className="flex h-14 w-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {weekDayLabels.map((label, index) => (
                <span key={`${label}-${index}`} className="py-1">
                  {label}
                </span>
              ))}
            </div>

            <div className="space-y-2.5">
              {weekRows.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="grid grid-cols-7 gap-1.5 rounded-full bg-muted/70 px-2 py-1.5"
                >
                  {week.map(({ date, isCurrentMonth }) => {
                    const isToday = isSameDay(date, new Date());
                    const isSelected = isSameDay(date, selectedDate);
                    const consultationCount =
                      consultationsByDay.get(date.toDateString()) ?? 0;

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "relative flex h-12 items-center justify-center rounded-full text-base font-medium transition-all",
                          isCurrentMonth ? "text-foreground" : "text-muted-foreground/55",
                          isToday && "ring-1 ring-primary/35",
                          isSelected &&
                            "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(74,134,106,0.28)]",
                        )}
                      >
                        <span>{date.getDate()}</span>
                        {consultationCount > 0 ? (
                          <span
                            className={cn(
                              "absolute -bottom-0.5 left-1/2 flex min-w-4 -translate-x-1/2 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-4",
                              isSelected
                                ? "bg-primary-foreground/90 text-primary"
                                : "bg-primary/15 text-primary",
                            )}
                          >
                            {consultationCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[34px] border border-border bg-card p-5 shadow-card md:p-6">
            <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-card-foreground">
                  Consultas del dia
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(selectedDate.toISOString(), {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="rounded-2xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                {selectedDayConsultations.length} consultas
              </div>
            </div>

            {consultationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando consultas...</p>
            ) : selectedDayConsultations.length === 0 ? (
              <div className="rounded-[24px] bg-muted px-4 py-5 text-sm text-muted-foreground">
                No hay consultas cargadas para este dia.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex items-center gap-4 rounded-[26px] border border-border bg-background px-4 py-4"
                  >
                    <div className="min-w-[78px] rounded-3xl bg-muted px-3 py-3 text-center">
                      <p className="text-lg font-semibold text-card-foreground">
                        {new Intl.DateTimeFormat("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(consultation.startsAt))}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-card-foreground">
                        {consultation.patientName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Estado: {consultation.status}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        consultation.status === "completed"
                          ? "bg-success"
                          : consultation.status === "scheduled"
                            ? "bg-primary"
                            : "bg-muted-foreground/40",
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
