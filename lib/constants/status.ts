import type { StatutPresence } from "@prisma/client";

export const PRESENCE_STATUS = {
  PRESENT: { label: "Présent", color: "bg-green-100 text-green-800 border-green-200" },
  ABSENT: { label: "Absent", color: "bg-red-100 text-red-800 border-red-200" },
  RETARD: { label: "Retard", color: "bg-orange-100 text-orange-800 border-orange-200" },
  EXCUSE: { label: "Excusé", color: "bg-blue-100 text-blue-800 border-blue-200" },
} as const satisfies Record<StatutPresence, { label: string; color: string }>;

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  PROFESSEUR: "Professeur",
  PARENT: "Parent",
  ELEVE: "Élève",
} as const;
