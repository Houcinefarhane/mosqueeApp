import type { TypeDevoir } from "@prisma/client";

export const DEVOIR_TYPES = {
  DEVOIR: {
    label: "Devoir",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  CAHIER_TEXTE: {
    label: "Cahier de texte",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
} as const satisfies Record<TypeDevoir, { label: string; color: string }>;

export const MATIERES = [
  "Coran",
  "Tajwid",
  "Arabe",
  "Fiqh",
  "Sira",
  "Akida",
  "Autre",
] as const;
