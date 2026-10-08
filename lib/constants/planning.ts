export const JOURS = [
  "DIMANCHE",
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
] as const;

export type JourSemaine = (typeof JOURS)[number];

export const JOURS_LABELS: Record<JourSemaine, string> = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
};

/** Ordre d'affichage emploi du temps (lundi → dimanche) */
export const JOURS_SEMAINE: JourSemaine[] = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
  "DIMANCHE",
];

export function parseHeureMinutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatPlageHoraire(debut: string, fin: string): string {
  return `${debut.replace(":", "h")} – ${fin.replace(":", "h")}`;
}

/** Retourne le jour Prisma (LUNDI, MARDI…) pour une date donnée */
export function getJourFromDate(date: Date = new Date()): JourSemaine {
  return JOURS[date.getDay()];
}

/** Index du jour dans la semaine (0 = Lundi) */
export function getWeekdayIndex(jour: JourSemaine): number {
  const order: JourSemaine[] = [
    "LUNDI",
    "MARDI",
    "MERCREDI",
    "JEUDI",
    "VENDREDI",
    "SAMEDI",
    "DIMANCHE",
  ];
  return order.indexOf(jour);
}

/** Début et fin du mois en cours */
export function getMonthBounds(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/** Début du mois en cours */
export function getMonthStart(date: Date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Jours affichés dans la grille hebdomadaire (lun. → sam., dim. si cours) */
export function getWeekDisplayDays(
  events: { jour: string }[]
): JourSemaine[] {
  const hasSunday = events.some((e) => e.jour === "DIMANCHE");
  const base: JourSemaine[] = [
    "LUNDI",
    "MARDI",
    "MERCREDI",
    "JEUDI",
    "VENDREDI",
    "SAMEDI",
  ];
  return hasSunday ? [...base, "DIMANCHE"] : base;
}

const JOUR_ABBR: Record<JourSemaine, string> = {
  LUNDI: "Lun",
  MARDI: "Mar",
  MERCREDI: "Mer",
  JEUDI: "Jeu",
  VENDREDI: "Ven",
  SAMEDI: "Sam",
  DIMANCHE: "Dim",
};

export function getJourAbbr(jour: JourSemaine): string {
  return JOUR_ABBR[jour];
}

/** Bornes horaires pour la grille (minutes depuis minuit), avec marge */
export function getWeeklyTimeBounds(
  events: { heureDebut: string; heureFin: string }[]
): { startMinutes: number; endMinutes: number } {
  if (events.length === 0) {
    return { startMinutes: 8 * 60, endMinutes: 18 * 60 };
  }
  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
    min = Math.min(min, parseHeureMinutes(e.heureDebut));
    max = Math.max(max, parseHeureMinutes(e.heureFin));
  }
  const startMinutes = Math.max(0, Math.floor(min / 60) * 60 - 30);
  const endMinutes = Math.min(24 * 60, Math.ceil(max / 60) * 60 + 30);
  return { startMinutes, endMinutes };
}

export function formatHeureCourte(heure: string): string {
  const [h, m] = heure.split(":");
  const hour = parseInt(h ?? "0", 10);
  const mins = m ?? "00";
  if (mins === "00") return `${hour}h`;
  return `${hour}h${mins}`;
}
