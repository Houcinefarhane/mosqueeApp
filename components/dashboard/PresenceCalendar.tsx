"use client";

import { cn } from "@/lib/utils";
import { PRESENCE_STATUS } from "@/lib/constants/status";
import type { StatutPresence } from "@prisma/client";

interface PresenceDay {
  date: string;
  statut: StatutPresence;
}

interface PresenceCalendarProps {
  presences: PresenceDay[];
  month?: number;
  year?: number;
}

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const STATUT_DOT: Record<StatutPresence, string> = {
  PRESENT: "bg-success",
  ABSENT: "bg-danger",
  RETARD: "bg-orange-500",
  EXCUSE: "bg-blue-500",
};

export default function PresenceCalendar({
  presences,
  month = new Date().getMonth(),
  year = new Date().getFullYear(),
}: PresenceCalendarProps) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Lundi = 0
  const startOffset = (firstDay.getDay() + 6) % 7;

  const presenceMap = new Map<string, StatutPresence>();
  for (const p of presences) {
    const d = new Date(p.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      presenceMap.set(String(d.getDate()), p.statut);
    }
  }

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(firstDay);

  return (
    <div>
      <p className="mb-3 text-sm font-medium capitalize text-foreground">
        {monthLabel}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_HEADERS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-medium text-gray-400"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const statut = presenceMap.get(String(day));
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <div
              key={day}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg text-xs",
                isToday && "ring-2 ring-primary/30 bg-primary/5",
                !statut && "text-gray-400"
              )}
              title={
                statut
                  ? `${day} — ${PRESENCE_STATUS[statut].label}`
                  : String(day)
              }
            >
              <span className={cn("font-medium", statut && "text-foreground")}>
                {day}
              </span>
              {statut && (
                <span
                  className={cn("mt-0.5 h-1.5 w-1.5 rounded-full", STATUT_DOT[statut])}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {(Object.keys(PRESENCE_STATUS) as StatutPresence[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={cn("h-2 w-2 rounded-full", STATUT_DOT[s])} />
            {PRESENCE_STATUS[s].label}
          </div>
        ))}
      </div>
    </div>
  );
}
