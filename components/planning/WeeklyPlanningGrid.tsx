"use client";

import { useMemo } from "react";
import {
  getJourAbbr,
  getWeeklyTimeBounds,
  getWeekDisplayDays,
  JOURS_LABELS,
  parseHeureMinutes,
  formatHeureCourte,
  formatPlageHoraire,
  type JourSemaine,
} from "@/lib/constants/planning";
import { cn } from "@/lib/utils";

export type WeeklyPlanningEvent = {
  id: string;
  jour: JourSemaine;
  heureDebut: string;
  heureFin: string;
  matiere: string;
  /** Ligne secondaire : classe, salle, prof… */
  meta?: string;
};

type LayoutEvent = WeeklyPlanningEvent & {
  column: number;
  columnCount: number;
};

const PX_PER_HOUR = 52;
const GUTTER_WIDTH = 44;

function layoutDayEvents(events: WeeklyPlanningEvent[]): LayoutEvent[] {
  const sorted = [...events].sort(
    (a, b) => parseHeureMinutes(a.heureDebut) - parseHeureMinutes(b.heureDebut)
  );
  const columns: WeeklyPlanningEvent[][] = [];

  for (const ev of sorted) {
    const start = parseHeureMinutes(ev.heureDebut);
    let placed = false;
    for (const col of columns) {
      const last = col[col.length - 1];
      if (start >= parseHeureMinutes(last.heureFin)) {
        col.push(ev);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([ev]);
  }

  const columnCount = Math.max(1, columns.length);
  const result: LayoutEvent[] = [];
  columns.forEach((col, columnIndex) => {
    for (const ev of col) {
      result.push({ ...ev, column: columnIndex, columnCount });
    }
  });
  return result;
}

function hourLabels(startMinutes: number, endMinutes: number): number[] {
  const labels: number[] = [];
  for (let m = startMinutes; m < endMinutes; m += 60) {
    labels.push(m);
  }
  return labels;
}

type WeeklyPlanningGridProps = {
  events: WeeklyPlanningEvent[];
  today?: JourSemaine;
  emptyMessage?: string;
  className?: string;
};

export default function WeeklyPlanningGrid({
  events,
  today,
  emptyMessage = "Aucun cours cette semaine",
  className,
}: WeeklyPlanningGridProps) {
  const days = useMemo(() => getWeekDisplayDays(events), [events]);
  const { startMinutes, endMinutes } = useMemo(
    () => getWeeklyTimeBounds(events),
    [events]
  );
  const totalMinutes = endMinutes - startMinutes;
  const gridHeight = (totalMinutes / 60) * PX_PER_HOUR;
  const hours = hourLabels(startMinutes, endMinutes);

  const layoutByDay = useMemo(() => {
    const map = new Map<JourSemaine, LayoutEvent[]>();
    for (const day of days) {
      const dayEvents = events.filter((e) => e.jour === day);
      map.set(day, layoutDayEvents(dayEvents));
    }
    return map;
  }, [days, events]);

  if (events.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-brun-doux">{emptyMessage}</p>
    );
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-3xl border border-filet bg-blanc",
        className
      )}
    >
      <div className="min-w-[640px]">
        {/* En-têtes jours */}
        <div
          className="grid border-b border-filet bg-sable/80"
          style={{
            gridTemplateColumns: `${GUTTER_WIDTH}px repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="border-r border-filet" aria-hidden />
          {days.map((jour) => {
            const isToday = today === jour;
            return (
              <div
                key={jour}
                className={cn(
                  "border-r border-filet px-1 py-2 text-center last:border-r-0 sm:px-2 sm:py-2.5",
                  isToday && "bg-brun text-blanc"
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide sm:hidden">
                  {getJourAbbr(jour)}
                </p>
                <p className="hidden text-xs font-bold uppercase tracking-wide sm:block">
                  {JOURS_LABELS[jour]}
                </p>
                {isToday && (
                  <p className="mt-0.5 text-[9px] font-semibold text-or-clair sm:text-[10px]">
                    Aujourd&apos;hui
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative flex">
          {/* Axe horaire */}
          <div
            className="relative shrink-0 border-r border-filet bg-blanc"
            style={{ width: GUTTER_WIDTH, height: gridHeight }}
          >
            {hours.map((minute) => {
              const top =
                ((minute - startMinutes) / totalMinutes) * gridHeight;
              return (
                <div
                  key={minute}
                  className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-brun-doux"
                  style={{ top }}
                >
                  {formatHeureCourte(
                    `${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}`
                  )}
                </div>
              );
            })}
          </div>

          {/* Grille */}
          <div
            className="relative grid flex-1"
            style={{
              gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
              height: gridHeight,
            }}
          >
            {days.map((jour) => {
              const isToday = today === jour;
              return (
                <div
                  key={jour}
                  className={cn(
                    "relative border-r border-filet last:border-r-0",
                    isToday && "bg-or/[0.04]"
                  )}
                >
                  {hours.map((minute) => {
                    const top =
                      ((minute - startMinutes) / totalMinutes) * gridHeight;
                    return (
                      <div
                        key={minute}
                        className="pointer-events-none absolute inset-x-0 border-t border-filet/70"
                        style={{ top }}
                      />
                    );
                  })}

                  {(layoutByDay.get(jour) ?? []).map((ev) => {
                    const top =
                      ((parseHeureMinutes(ev.heureDebut) - startMinutes) /
                        totalMinutes) *
                      gridHeight;
                    const height = Math.max(
                      28,
                      ((parseHeureMinutes(ev.heureFin) -
                        parseHeureMinutes(ev.heureDebut)) /
                        totalMinutes) *
                        gridHeight
                    );
                    const widthPct = 100 / ev.columnCount;
                    const leftPct = ev.column * widthPct;

                    return (
                      <div
                        key={ev.id}
                        className="absolute z-[1] overflow-hidden rounded-lg border border-or/40 bg-or/15 px-1 py-0.5 shadow-sm sm:px-1.5 sm:py-1"
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                        title={`${ev.matiere} — ${formatPlageHoraire(ev.heureDebut, ev.heureFin)}${ev.meta ? ` — ${ev.meta}` : ""}`}
                      >
                        <p className="truncate text-[10px] font-bold leading-tight text-brun sm:text-xs">
                          {ev.matiere}
                        </p>
                        <p className="truncate text-[9px] tabular-nums text-brun-doux sm:text-[10px]">
                          {formatPlageHoraire(ev.heureDebut, ev.heureFin)}
                        </p>
                        {ev.meta && height >= 40 && (
                          <p className="mt-0.5 hidden truncate text-[9px] text-brun-doux sm:block">
                            {ev.meta}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
