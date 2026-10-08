import { prisma } from "@/lib/prisma";

export type PushKind = "annonces" | "messages" | "absences";

export async function isPushEnabledForUser(
  userId: string,
  kind: PushKind
): Promise<boolean> {
  const pref = await prisma.pushNotificationPreference.findUnique({
    where: { userId },
  });
  if (!pref) return true;
  switch (kind) {
    case "annonces":
      return pref.annoncesEnabled;
    case "messages":
      return pref.messagesEnabled;
    case "absences":
      return pref.absencesEnabled;
    default:
      return true;
  }
}

export async function filterUsersByPushPreference(
  userIds: string[],
  kind: PushKind
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const prefs = await prisma.pushNotificationPreference.findMany({
    where: { userId: { in: userIds } },
  });
  const prefMap = new Map(prefs.map((p) => [p.userId, p]));
  return userIds.filter((id) => {
    const p = prefMap.get(id);
    if (!p) return true;
    if (kind === "annonces") return p.annoncesEnabled;
    if (kind === "messages") return p.messagesEnabled;
    return p.absencesEnabled;
  });
}
