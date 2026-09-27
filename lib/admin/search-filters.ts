import type { Prisma } from "@prisma/client";

function contains(value: string) {
  return { contains: value, mode: "insensitive" as const };
}

export function buildEleveSearchWhere(
  mosqueeId: string,
  q: string
): Prisma.EleveWhereInput {
  const base: Prisma.EleveWhereInput = { mosqueeId };

  if (!q) return base;

  return {
    ...base,
    OR: [
      { nom: contains(q) },
      { prenom: contains(q) },
      { email: contains(q) },
      { telephone: contains(q) },
      { classe: { nom: contains(q) } },
      { parent: { nom: contains(q) } },
      { parent: { prenom: contains(q) } },
      { parent: { email: contains(q) } },
    ],
  };
}

export function buildParentSearchWhere(
  mosqueeId: string,
  q: string
): Prisma.UserWhereInput {
  const base: Prisma.UserWhereInput = { mosqueeId, role: "PARENT" };

  if (!q) return base;

  return {
    ...base,
    OR: [
      { nom: contains(q) },
      { prenom: contains(q) },
      { email: contains(q) },
      { telephone: contains(q) },
    ],
  };
}
