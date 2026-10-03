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
