import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useDashboardConsultationsQuery } from "@/hooks/use-crm-data";
import { cn } from "@/lib/utils";

function getCalendarDays(referenceDate: Date) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  const startDay = monthStart.getDay();
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

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
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

function getStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Realizada";
    case "cancelled":
      return "Cancelada";
    case "no_show":
      return "Ausente";
    default:
      return "Confirmada";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "border-success/35 bg-success/15 text-success";
    case "cancelled":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "no_show":
      return "border-muted-foreground/25 bg-muted text-muted-foreground";
    default:
      return "border-primary/35 bg-primary/12 text-primary";
  }
}

function getTimelineDotClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-success";
    case "cancelled":
      return "bg-destructive";
    case "no_show":
      return "bg-muted-foreground/60";
    default:
      return "bg-primary";
  }
}

const weekDayLabels = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "long" });
const yearFormatter = new Intl.DateTimeFormat("es-AR", { year: "numeric" });
const longDateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const selectedDayFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const weekRangeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
});
const shortWeekdayFormatter = new Intl.DateTimeFormat("es-AR", { weekday: "short" });
const dayNumberFormatter = new Intl.DateTimeFormat("es-AR", { day: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

const Home = () => {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => today);
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
  const pageDateLabel = capitalizeLabel(longDateFormatter.format(today));
  const selectedDayLabel = capitalizeLabel(selectedDayFormatter.format(selectedDate));

  const calendarDays = getCalendarDays(visibleMonth);
  const consultations = consultationsQuery.data ?? [];
  const weekStart = useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => getEndOfWeek(selectedDate), [selectedDate]);
  const weekEndLabelDate = useMemo(() => new Date(weekEnd.getTime() - 1), [weekEnd]);

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

  return (
    <AppLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,251,231,0.98),_rgba(243,238,210,0.92))]">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary/70">
                Inicio
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Panel de Control
              </h1>
              <p className="mt-2 text-sm uppercase tracking-[0.22em] text-muted-foreground">
                {pageDateLabel}
              </p>
            </div>

            <div className="inline-flex w-full max-w-sm items-center justify-between rounded-[24px] border border-border/80 bg-card/70 px-4 py-3 shadow-soft">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Agenda activa
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selecciona un dia para ver el detalle.
                </p>
              </div>
              <div className="rounded-2xl bg-primary/12 px-3 py-2 text-sm font-semibold text-primary">
                {selectedDayConsultations.length}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="rounded-[34px] border border-[#6d755f]/60 bg-[linear-gradient(180deg,rgba(250,247,221,0.9),rgba(244,240,214,0.95))] p-5 shadow-[0_16px_36px_rgba(91,88,66,0.12)] md:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h2 className="font-display text-[1.85rem] font-semibold tracking-tight text-foreground md:text-[2rem]">
                    <span className="block text-[0.95em] text-primary/82">{yearLabel}</span>
                    <span className="block text-[0.85em] uppercase tracking-[0.12em] text-[#a85f1d]">
                      {monthLabel}
                    </span>
                  </h2>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    Calendario del consultorio
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleMonth(
                        new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#6d755f]/70 bg-card/50 text-foreground transition-all hover:-translate-y-0.5 hover:bg-card"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleMonth(
                        new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#6d755f]/70 bg-card/50 text-foreground transition-all hover:-translate-y-0.5 hover:bg-card"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-x-1.5 gap-y-3 text-center">
                {weekDayLabels.map((label) => (
                  <span
                    key={label}
                    className="pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}

                {calendarDays.map(({ date, isCurrentMonth }) => {
                  const isToday = isSameDay(date, today);
                  const isSelected = isSameDay(date, selectedDate);
                  const consultationCount = consultationsByDay.get(date.toDateString()) ?? 0;

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
                        "relative mx-auto flex h-12 w-full max-w-[46px] items-center justify-center rounded-[16px] border border-transparent text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                        isCurrentMonth ? "text-foreground" : "text-muted-foreground/35",
                        !isSelected && "hover:border-[#6d755f]/40 hover:bg-card/35 hover:text-foreground",
                        isToday && !isSelected && "border-primary/20 bg-card/20",
                        isSelected &&
                          "border-[#2e4b39] bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(58,95,71,0.28)]",
                      )}
                    >
                      <span>{date.getDate()}</span>
                      {consultationCount > 0 ? (
                        <span
                          className={cn(
                            "absolute bottom-1.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full",
                            isSelected ? "bg-[#c98d28]" : "bg-primary/70",
                          )}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#6d755f]/55 bg-card/82 p-5 shadow-[0_14px_30px_rgba(91,88,66,0.12)] md:p-6 xl:h-fit">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
                    Agenda del dia
                  </p>
                  <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
                    {selectedDayLabel}
                  </h2>
                </div>

                <div className="rounded-2xl border border-border bg-background/80 px-3 py-2 text-sm font-semibold text-foreground">
                  {selectedDayConsultations.length}
                </div>
              </div>

              {consultationsQuery.isLoading ? (
                <div className="mt-6 rounded-[22px] border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
                  Cargando agenda diaria...
                </div>
              ) : selectedDayConsultations.length === 0 ? (
                <div className="mt-6 rounded-[22px] border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
                  No hay consultas cargadas para este dia.
                </div>
              ) : (
                <div className="relative mt-8">
                  <div className="absolute bottom-3 left-[7px] top-2 w-px bg-border" />

                  <div className="space-y-6">
                    {selectedDayConsultationsByTime.map(([time, consultationsAtTime]) => (
                      <div key={time} className="relative pl-11">
                        <span
                          className={cn(
                            "absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-card",
                            getTimelineDotClass(consultationsAtTime[0]?.status ?? "scheduled"),
                          )}
                        />

                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#a55d1e]">
                          {time}
                        </p>

                        <div className="space-y-3">
                          {consultationsAtTime.map((consultation) => (
                            <article
                              key={consultation.id}
                              className="rounded-[22px] border border-[#6d755f]/45 bg-[linear-gradient(180deg,rgba(249,246,223,0.94),rgba(242,238,212,0.98))] p-4 shadow-soft"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-display text-3xl font-semibold text-foreground">
                                    {consultation.patientName}
                                  </p>
                                  <p className="mt-2 text-sm italic text-muted-foreground">
                                    Estado: {getStatusLabel(consultation.status).toLowerCase()}
                                  </p>
                                </div>

                                <span
                                  className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
                                    getStatusBadgeClass(consultation.status),
                                  )}
                                >
                                  {getStatusLabel(consultation.status)}
                                </span>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="xl:col-span-2 rounded-[30px] border border-[#6d755f]/55 bg-[linear-gradient(180deg,rgba(250,247,221,0.82),rgba(245,241,214,0.92))] p-5 shadow-[0_14px_30px_rgba(91,88,66,0.12)] md:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground">
                    Consultas de la semana
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Del {weekRangeFormatter.format(weekStart).toLowerCase()} al{" "}
                    {weekRangeFormatter.format(weekEndLabelDate).toLowerCase()}
                  </p>
                </div>

                <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  {selectedWeekConsultations.length} consultas
                </div>
              </div>

              {consultationsQuery.isLoading ? (
                <div className="rounded-[22px] border border-dashed border-border bg-card/45 px-4 py-5 text-sm text-muted-foreground">
                  Cargando agenda semanal...
                </div>
              ) : selectedWeekConsultations.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-border bg-card/45 px-4 py-5 text-sm text-muted-foreground">
                  No hay consultas cargadas para la semana seleccionada.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedWeekConsultations.map((consultation) => {
                    const consultationDate = new Date(consultation.startsAt);
                    const weekday = shortWeekdayFormatter
                      .format(consultationDate)
                      .replace(".", "")
                      .toUpperCase();
                    const dayNumber = dayNumberFormatter.format(consultationDate);

                    return (
                      <article
                        key={consultation.id}
                        className="flex flex-col gap-4 rounded-[24px] border border-[#6d755f]/45 bg-card/55 px-4 py-4 shadow-card sm:flex-row sm:items-center"
                      >
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[18px] border border-[#6d755f]/45 bg-background/80 text-center">
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b76b28]">
                            {weekday}
                          </span>
                          <span className="mt-1 font-serif text-2xl font-semibold text-foreground">
                            {dayNumber}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-3xl font-semibold leading-none text-foreground">
                            {consultation.patientName}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {capitalizeLabel(
                              selectedDayFormatter.format(consultationDate).toLowerCase(),
                            )}{" "}
                            - {timeFormatter.format(consultationDate)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-sm font-medium",
                              getStatusBadgeClass(consultation.status),
                            )}
                          >
                            {getStatusLabel(consultation.status)}
                          </span>
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
