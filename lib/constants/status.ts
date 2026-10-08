import type { StatutPresence } from "@prisma/client";

export const PRESENCE_STATUS = {
  PRESENT: { label: "Présent", color: "bg-or/15 text-brun border-or/30" },
  ABSENT: { label: "Absent", color: "bg-brun/10 text-brun border-brun/25" },
  RETARD: { label: "Retard", color: "bg-or-clair/30 text-nuit border-or/40" },
  EXCUSE: { label: "Excusé", color: "bg-sable text-brun-doux border-filet" },
} as const satisfies Record<StatutPresence, { label: string; color: string }>;

export const ROLE_LABELS = {
  ADMIN: "Direction",
  PROFESSEUR: "Enseignant",
  PARENT: "Famille",
  ELEVE: "Élève",
} as const;
