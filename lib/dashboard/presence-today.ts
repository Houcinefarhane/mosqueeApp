import { prisma } from "@/lib/prisma";
import { getJourFromDate, JOURS_LABELS } from "@/lib/constants/planning";

export type PresenceTodayStats = {
  jour: string;
  jourLabel: string;
  classeIds: string[];
  coursCount: number;
  attendus: number;
  presents: number;
  absents: number;
  retards: number;
  marques: number;
  taux: number | null;
};

export async function getPresenceStatsToday(
  mosqueeId: string,
  today: Date,
  tomorrow: Date
): Promise<PresenceTodayStats> {
  const jour = getJourFromDate(today);

  const plannings = await prisma.planning.findMany({
    where: { mosqueeId, jour },
    select: { classeId: true },
  });
  const classeIds = [...new Set(plannings.map((p) => p.classeId))];

  const attendus =
    classeIds.length > 0
      ? await prisma.eleve.count({
          where: { mosqueeId, classeId: { in: classeIds } },
        })
      : 0;

  const baseWhere =
    classeIds.length > 0
      ? {
          mosqueeId,
          date: { gte: today, lt: tomorrow },
          classeId: { in: classeIds },
        }
      : null;

  let presents = 0;
  let absents = 0;
  let retards = 0;
  let marques = 0;

  if (baseWhere) {
    [presents, absents, retards, marques] = await Promise.all([
      prisma.presence.count({ where: { ...baseWhere, statut: "PRESENT" } }),
      prisma.presence.count({
        where: { ...baseWhere, statut: { in: ["ABSENT", "EXCUSE"] } },
      }),
      prisma.presence.count({ where: { ...baseWhere, statut: "RETARD" } }),
      prisma.presence.count({ where: baseWhere }),
    ]);
  }

  const taux = attendus > 0 ? Math.round((presents / attendus) * 100) : null;

  return {
    jour,
    jourLabel: JOURS_LABELS[jour],
    classeIds,
    coursCount: classeIds.length,
    attendus,
    presents,
    absents,
    retards,
    marques,
    taux,
  };
}
