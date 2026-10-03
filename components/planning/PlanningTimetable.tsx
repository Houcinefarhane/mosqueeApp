import Link from "next/link";
import { Clock, MapPin, User } from "lucide-react";
import {
  JOURS_LABELS,
  JOURS_SEMAINE,
  formatPlageHoraire,
  parseHeureMinutes,
  type JourSemaine,
} from "@/lib/constants/planning";
import { cn } from "@/lib/utils";

export type PlanningTimetableEntry = {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  matiere: string;
  classe: {
    id: string;
    nom: string;
    niveau: string;
    salle: string | null;
    professeur: { prenom: string; nom: string } | null;
  };
};

type TimeSlot = {
  key: string;
  heureDebut: string;
  heureFin: string;
  cours: PlanningTimetableEntry[];
};

/** Au-delà de ce seuil, le jour passe en vue matrice (pleine largeur) */
const HEAVY_DAY_THRESHOLD = 4;

function groupByDayAndSlot(
  entries: PlanningTimetableEntry[]
): Map<JourSemaine, TimeSlot[]> {
  const byDay = new Map<JourSemaine, Map<string, TimeSlot>>();

  for (const entry of entries) {
    const jour = entry.jour as JourSemaine;
    if (!JOURS_SEMAINE.includes(jour)) continue;

    if (!byDay.has(jour)) byDay.set(jour, new Map());
    const daySlots = byDay.get(jour)!;

    const key = `${entry.heureDebut}-${entry.heureFin}`;
    if (!daySlots.has(key)) {
      daySlots.set(key, {
        key,
        heureDebut: entry.heureDebut,
        heureFin: entry.heureFin,
        cours: [],
      });
    }
    daySlots.get(key)!.cours.push(entry);
  }

  const result = new Map<JourSemaine, TimeSlot[]>();
  for (const jour of JOURS_SEMAINE) {
    const slots = byDay.get(jour);
    if (!slots) {
      result.set(jour, []);
      continue;
    }
    const sorted = [...slots.values()].sort(
      (a, b) => parseHeureMinutes(a.heureDebut) - parseHeureMinutes(b.heureDebut)
    );
    for (const slot of sorted) {
      slot.cours.sort((a, b) => a.classe.nom.localeCompare(b.classe.nom, "fr"));
    }
    result.set(jour, sorted);
  }
  return result;
}

function countCourses(slots: TimeSlot[]): number {
  return slots.reduce((n, s) => n + s.cours.length, 0);
}

function CourseChip({
  entry,
  classLinkPrefix,
  compact,
}: {
  entry: PlanningTimetableEntry;
  classLinkPrefix: string;
  compact?: boolean;
}) {
  const { classe: c } = entry;
  const prof = c.professeur
    ? `${c.professeur.prenom} ${c.professeur.nom.charAt(0)}.`
    : null;

  if (compact) {
    return (
      <Link
        href={`${classLinkPrefix}/${c.id}`}
        title={`${c.nom} — ${entry.matiere} — ${c.niveau}${c.salle ? ` — ${c.salle}` : ""}${prof ? ` — ${prof}` : ""}`}
        className="block rounded-md border border-gray-100 bg-white px-2 py-1.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <p className="truncate text-xs font-semibold text-foreground">{c.nom}</p>
        <p className="mt-0.5 truncate text-[10px] leading-tight text-gray-500">
          {[c.salle, prof].filter(Boolean).join(" · ") || entry.matiere}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={`${classLinkPrefix}/${c.id}`}
      className="block rounded-lg border border-gray-100 bg-surface-muted p-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <p className="text-sm font-semibold leading-tight text-foreground">
        {c.nom}
      </p>
      <p className="mt-0.5 text-xs text-gray-600">
        {entry.matiere} · {c.niveau}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
        {c.salle && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {c.salle}
          </span>
        )}
        {c.professeur && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {c.professeur.prenom} {c.professeur.nom}
          </span>
        )}
      </div>
    </Link>
  );
}

function DayHeader({
  jour,
  courseCount,
  isToday,
}: {
  jour: JourSemaine;
  courseCount: number;
  isToday: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b px-3 py-2",
        isToday ? "bg-primary text-white" : "bg-gray-50"
      )}
    >
      <p className="text-sm font-semibold">{JOURS_LABELS[jour]}</p>
      <p className={cn("text-xs", isToday ? "text-white/80" : "text-gray-500")}>
        {courseCount} cours
      </p>
    </div>
  );
}

function LightDayColumn({
  jour,
  slots,
  isToday,
  classLinkPrefix,
}: {
  jour: JourSemaine;
  slots: TimeSlot[];
  isToday: boolean;
  classLinkPrefix: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-white",
        isToday ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
      )}
    >
      <DayHeader jour={jour} courseCount={countCourses(slots)} isToday={isToday} />
      <div className="space-y-2 p-2">
        {slots.map((slot) => (
          <div key={slot.key}>
            <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              <Clock className="h-3 w-3" />
              {formatPlageHoraire(slot.heureDebut, slot.heureFin)}
            </p>
            <div className="space-y-1.5">
              {slot.cours.map((c) => (
                <CourseChip
                  key={c.id}
                  entry={c}
                  classLinkPrefix={classLinkPrefix}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeavyDayMatrix({
  jour,
  slots,
  isToday,
  classLinkPrefix,
}: {
  jour: JourSemaine;
  slots: TimeSlot[];
  isToday: boolean;
  classLinkPrefix: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white",
        isToday ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
      )}
    >
      <DayHeader jour={jour} courseCount={countCourses(slots)} isToday={isToday} />
      <div className="divide-y divide-gray-100">
        {slots.map((slot) => (
          <div
            key={slot.key}
            className="flex flex-col gap-2 p-2 sm:flex-row sm:items-start sm:gap-3 sm:p-3"
          >
            <div className="flex shrink-0 items-center gap-1 sm:w-[7.5rem] sm:pt-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-gray-700">
                {formatPlageHoraire(slot.heureDebut, slot.heureFin)}
              </span>
              <span className="text-[10px] text-gray-400 sm:hidden">
                ({slot.cours.length})
              </span>
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {slot.cours.map((c) => (
                <CourseChip
                  key={c.id}
                  entry={c}
                  classLinkPrefix={classLinkPrefix}
                  compact
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PlanningTimetableProps {
  entries: PlanningTimetableEntry[];
  today?: JourSemaine;
  classLinkPrefix?: string;
  emptyMessage?: string;
}

export default function PlanningTimetable({
  entries,
  today,
  classLinkPrefix = "/admin/classes",
  emptyMessage = "Aucun cours planifié",
}: PlanningTimetableProps) {
  const byDay = groupByDayAndSlot(entries);
  const activeDays = JOURS_SEMAINE.filter(
    (j) => countCourses(byDay.get(j) ?? []) > 0
  );

  if (entries.length === 0) {
    return <p className="py-12 text-center text-gray-500">{emptyMessage}</p>;
  }

  const lightDays = activeDays.filter(
    (j) => countCourses(byDay.get(j) ?? []) < HEAVY_DAY_THRESHOLD
  );
  const heavyDays = activeDays.filter(
    (j) => countCourses(byDay.get(j) ?? []) >= HEAVY_DAY_THRESHOLD
  );

  return (
    <div className="space-y-4">
      {lightDays.length > 0 && (
        <div
          className={cn(
            "grid gap-3",
            lightDays.length === 1
              ? "grid-cols-1"
              : lightDays.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {lightDays.map((jour) => (
            <LightDayColumn
              key={jour}
              jour={jour}
              slots={byDay.get(jour) ?? []}
              isToday={today === jour}
              classLinkPrefix={classLinkPrefix}
            />
          ))}
        </div>
      )}

      {heavyDays.map((jour) => (
        <HeavyDayMatrix
          key={jour}
          jour={jour}
          slots={byDay.get(jour) ?? []}
          isToday={today === jour}
          classLinkPrefix={classLinkPrefix}
        />
      ))}
    </div>
  );
}
