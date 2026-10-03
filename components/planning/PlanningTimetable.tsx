import Link from "next/link";
import { BookOpen, Clock, MapPin, User } from "lucide-react";
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
  const activeDays = JOURS_SEMAINE.filter((j) => (byDay.get(j)?.length ?? 0) > 0);

  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500">{emptyMessage}</p>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        activeDays.length <= 2
          ? "grid-cols-1 sm:grid-cols-2"
          : activeDays.length <= 4
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7"
      )}
    >
      {JOURS_SEMAINE.map((jour) => {
        const slots = byDay.get(jour) ?? [];
        const isToday = today === jour;
        const hasCourses = slots.length > 0;

        return (
          <div
            key={jour}
            className={cn(
              "flex min-h-[120px] flex-col overflow-hidden rounded-xl border bg-white",
              isToday ? "border-primary ring-2 ring-primary/20" : "border-gray-200",
              !hasCourses && "opacity-60"
            )}
          >
            <div
              className={cn(
                "border-b px-3 py-2.5",
                isToday ? "bg-primary text-white" : "bg-gray-50"
              )}
            >
              <p className="text-sm font-semibold">{JOURS_LABELS[jour]}</p>
              {hasCourses ? (
                <p
                  className={cn(
                    "text-xs",
                    isToday ? "text-white/80" : "text-gray-500"
                  )}
                >
                  {slots.reduce((n, s) => n + s.cours.length, 0)} cours
                </p>
              ) : (
                <p
                  className={cn(
                    "text-xs",
                    isToday ? "text-white/80" : "text-gray-400"
                  )}
                >
                  —
                </p>
              )}
            </div>

            <div className="flex-1 space-y-3 p-2">
              {hasCourses ? (
                slots.map((slot) => (
                  <div key={slot.key}>
                    <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatPlageHoraire(slot.heureDebut, slot.heureFin)}
                    </div>
                    <div className="space-y-1.5">
                      {slot.cours.map((c) => (
                        <Link
                          key={c.id}
                          href={`${classLinkPrefix}/${c.classe.id}`}
                          className="block rounded-lg border border-gray-100 bg-surface-muted p-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
                        >
                          <p className="text-sm font-semibold leading-tight text-foreground">
                            {c.classe.nom}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-600">
                            {c.matiere} · {c.classe.niveau}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                            {c.classe.salle && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {c.classe.salle}
                              </span>
                            )}
                            {c.classe.professeur && (
                              <span className="inline-flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {c.classe.professeur.prenom}{" "}
                                {c.classe.professeur.nom}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-1 items-center justify-center py-6">
                  <BookOpen className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
