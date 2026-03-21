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

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return start;
}

function getEndOfWeek(date: Date) {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 7);
  return end;
}

function capitalizeLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const weekDayLabels = ["L", "M", "M", "J", "V", "S", "D"];
const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "long" });
const yearFormatter = new Intl.DateTimeFormat("es-AR", { year: "numeric" });
const dayFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

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

  const monthLabel = capitalizeLabel(monthFormatter.format(visibleMonth));
  const yearLabel = yearFormatter.format(visibleMonth);

  const calendarDays = getCalendarDays(visibleMonth);
  const weekRows = chunkWeeks(calendarDays, 7);
  const consultations = consultationsQuery.data ?? [];
  const weekStart = useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => getEndOfWeek(selectedDate), [selectedDate]);

  const consultationsByDay = useMemo(() => {
    const counts = new Map<string, number>();

    consultations.forEach((consultation) => {
      const key = new Date(consultation.startsAt).toDateString();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [consultations]);

  const selectedWeekConsultations = useMemo(
    () =>
      consultations
        .filter((consultation) => {
          const consultationDate = new Date(consultation.startsAt);
          return consultationDate >= weekStart && consultationDate < weekEnd;
        })
        .sort(
          (left, right) =>
            new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
        ),
    [consultations, weekEnd, weekStart],
  );

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

  const selectedDayConsultationsByTime = useMemo(() => {
    const groups = new Map<string, typeof selectedDayConsultations>();

    selectedDayConsultations.forEach((consultation) => {
      const key = timeFormatter.format(new Date(consultation.startsAt));
      groups.set(key, [...(groups.get(key) ?? []), consultation]);
    });

    return Array.from(groups.entries());
  }, [selectedDayConsultations]);

  const selectedDayLabel = capitalizeLabel(dayFormatter.format(selectedDate));

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
                <h3 className="text-2xl font-semibold tracking-tight text-card-foreground">
                  <span className="block">{yearLabel}</span>
                  <span className="mt-0.5 block">{monthLabel}</span>
                </h3>
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
                        onClick={() => {
                          setSelectedDate(date);

                          if (!isCurrentMonth) {
                            setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                          }
                        }}
                        className={cn(
                          "relative flex h-12 items-center justify-center rounded-full text-base font-medium transition-all duration-200 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                          isCurrentMonth ? "text-foreground" : "text-muted-foreground/55",
                          isToday && "ring-1 ring-primary/35",
                          isSelected &&
                            "bg-primary text-primary-foreground ring-2 ring-primary/15 shadow-[0_10px_24px_rgba(74,134,106,0.28)] hover:bg-primary hover:text-primary-foreground",
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
                  Consultas de la semana
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Semana de {formatDate(weekStart.toISOString(), {
                    day: "numeric",
                    month: "long",
                  }).toLowerCase()} al{" "}
                  {formatDate(new Date(weekEnd.getTime() - 1).toISOString(), {
                    day: "numeric",
                    month: "long",
                  }).toLowerCase()}
                </p>
              </div>

              <div className="rounded-2xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                {selectedWeekConsultations.length} consultas
              </div>
            </div>

            {consultationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando consultas...</p>
            ) : (
              <div className="space-y-6">
                <div>
                  {selectedWeekConsultations.length === 0 ? (
                    <div className="rounded-[24px] bg-muted px-4 py-5 text-sm text-muted-foreground">
                      No hay consultas cargadas para esta semana.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedWeekConsultations.map((consultation) => (
                        <div
                          key={consultation.id}
                          className="flex items-center gap-4 rounded-[26px] border border-border bg-background px-4 py-4"
                        >
                          <div className="min-w-[76px] rounded-3xl bg-muted px-3 py-3 text-center">
                            <p className="text-sm font-semibold text-card-foreground">
                              {timeFormatter.format(new Date(consultation.startsAt))}
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                              {new Intl.DateTimeFormat("es-AR", {
                                weekday: "short",
                              })
                                .format(new Date(consultation.startsAt))
                                .replace(".", "")}
                            </p>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-card-foreground">
                              {consultation.patientName}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {capitalizeLabel(
                                formatDate(consultation.startsAt, {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                }).toLowerCase(),
                              )}
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
                </div>

                <div className="border-t border-border pt-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-card-foreground">
                        Consultas por horario
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedDayLabel}</p>
                    </div>

                    <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                      {selectedDayConsultations.length} consultas del dia
                    </div>
                  </div>

                  {selectedDayConsultations.length === 0 ? (
                    <div className="rounded-[24px] bg-muted px-4 py-5 text-sm text-muted-foreground">
                      No hay consultas cargadas para {selectedDayLabel.toLowerCase()}.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayConsultationsByTime.map(([time, consultationsAtTime]) => (
                        <div key={time} className="space-y-2.5">
                          <div className="flex items-center gap-3 px-1">
                            <div className="rounded-2xl bg-muted px-3 py-2 text-sm font-semibold text-card-foreground">
                              {time}
                            </div>
                            <div className="h-px flex-1 bg-border" />
                          </div>

                          <div className="space-y-2">
                            {consultationsAtTime.map((consultation) => (
                              <div
                                key={consultation.id}
                                className="flex items-center gap-4 rounded-[26px] border border-border bg-background px-4 py-4"
                              >
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
