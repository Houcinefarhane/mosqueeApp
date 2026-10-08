export type StatutPresence = "PRESENT" | "ABSENT" | "RETARD" | "EXCUSE";

/** Statut affiché dans l'UI (cycle tap) — « En attente » n'est pas persisté tel quel en API */
export type AppelUiStatut = "EN_ATTENTE" | StatutPresence;

export const APPEL_STATUT_CYCLE: AppelUiStatut[] = [
  "EN_ATTENTE",
  "PRESENT",
  "ABSENT",
  "RETARD",
  "EXCUSE",
];

export function nextAppelStatut(current: AppelUiStatut): AppelUiStatut {
  const i = APPEL_STATUT_CYCLE.indexOf(current);
  const next = APPEL_STATUT_CYCLE[(i + 1) % APPEL_STATUT_CYCLE.length];
  return next;
}

/** Valeur envoyée à l'API */
export function toApiStatut(ui: AppelUiStatut): StatutPresence {
  return ui === "EN_ATTENTE" ? "PRESENT" : ui;
}

export const APPEL_UI_LABELS: Record<AppelUiStatut, string> = {
  EN_ATTENTE: "En attente",
  PRESENT: "Présent",
  ABSENT: "Absent",
  RETARD: "Retard",
  EXCUSE: "Excusé",
};
