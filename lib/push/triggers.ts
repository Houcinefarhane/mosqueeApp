import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { notifyUsers } from "@/lib/push/send";
import {
  annoncesRouteForRole,
  messagesRouteForRole,
  presencesRouteForRole,
} from "@/lib/push/routes";

export function fireAnnoncePush(mosqueeId: string, titre: string): void {
  void (async () => {
    const users = await prisma.user.findMany({
      where: {
        mosqueeId,
        role: { in: ["PARENT", "PROFESSEUR"] },
      },
      select: { id: true, role: true },
    });
    const byRole = new Map<Role, string[]>();
    for (const u of users) {
      const list = byRole.get(u.role) ?? [];
      list.push(u.id);
      byRole.set(u.role, list);
    }
    for (const [role, ids] of byRole) {
      await notifyUsers(ids, "annonces", {
        title: "Nouvelle annonce",
        body: titre.slice(0, 120),
        route: annoncesRouteForRole(role),
      });
    }
  })();
}

export function fireMessagePush(
  receiverId: string,
  receiverRole: Role,
  objet: string
): void {
  void notifyUsers([receiverId], "messages", {
    title: "Nouveau message",
    body: objet.slice(0, 120),
    route: messagesRouteForRole(receiverRole),
  });
}

export function fireAbsencePushForEleve(
  eleveId: string,
  statut: "ABSENT" | "RETARD"
): void {
  void (async () => {
    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      select: {
        userId: true,
        parentId: true,
      },
    });
    if (!eleve) return;

    const label = statut === "ABSENT" ? "absence" : "retard";
    const body = `Signalement de ${label} à l'appel. Consultez les présences.`;

    if (eleve.parentId) {
      await notifyUsers([eleve.parentId], "absences", {
        title: "Présence — école coranique",
        body,
        route: presencesRouteForRole("PARENT"),
      });
    }
    if (eleve.userId) {
      await notifyUsers([eleve.userId], "absences", {
        title: "Présence — école coranique",
        body,
        route: presencesRouteForRole("ELEVE"),
      });
    }
  })();
}
