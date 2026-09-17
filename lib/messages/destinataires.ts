import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const userSelect = {
  id: true,
  prenom: true,
  nom: true,
  role: true,
  email: true,
} as const;

export type Destinataire = {
  id: string;
  prenom: string;
  nom: string;
  role: Role;
  email: string;
};

async function getAdminDestinataires(mosqueeId: string): Promise<Destinataire[]> {
  return prisma.user.findMany({
    where: { mosqueeId, role: "ADMIN" },
    select: userSelect,
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });
}

function mergeDestinataires(...lists: Destinataire[][]): Destinataire[] {
  const map = new Map<string, Destinataire>();
  for (const list of lists) {
    for (const d of list) {
      map.set(d.id, d);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr")
  );
}

async function hasMessageExchange(
  userId: string,
  otherUserId: string,
  mosqueeId: string
): Promise<boolean> {
  const count = await prisma.message.count({
    where: {
      mosqueeId,
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
  });
  return count > 0;
}

export async function getDestinataires(
  userId: string,
  role: Role,
  mosqueeId: string
): Promise<Destinataire[]> {
  switch (role) {
    case "ADMIN": {
      return prisma.user.findMany({
        where: { mosqueeId, id: { not: userId } },
        select: userSelect,
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      });
    }
    case "PROFESSEUR": {
      const eleves = await prisma.eleve.findMany({
        where: {
          mosqueeId,
          classe: { professeurId: userId },
        },
        select: { parentId: true, userId: true },
      });
      const contactIds = [
        ...new Set(
          eleves.flatMap((e) =>
            [e.parentId, e.userId].filter((id): id is string => id !== null)
          )
        ),
      ];
      const contacts =
        contactIds.length === 0
          ? []
          : await prisma.user.findMany({
              where: { id: { in: contactIds }, mosqueeId },
              select: userSelect,
            });
      const admins = await getAdminDestinataires(mosqueeId);
      return mergeDestinataires(contacts, admins);
    }
    case "PARENT": {
      const eleves = await prisma.eleve.findMany({
        where: { mosqueeId, parentId: userId },
        include: {
          classe: { select: { professeurId: true } },
        },
      });
      const profIds = [
        ...new Set(
          eleves
            .map((e) => e.classe.professeurId)
            .filter((id): id is string => id !== null)
        ),
      ];
      const profs =
        profIds.length === 0
          ? []
          : await prisma.user.findMany({
              where: { id: { in: profIds }, mosqueeId },
              select: userSelect,
            });
      const admins = await getAdminDestinataires(mosqueeId);
      return mergeDestinataires(profs, admins);
    }
    case "ELEVE": {
      const eleve = await prisma.eleve.findFirst({
        where: { userId, mosqueeId },
        include: {
          classe: { select: { professeurId: true } },
        },
      });
      const profs =
        eleve?.classe.professeurId
          ? await prisma.user.findMany({
              where: { id: eleve.classe.professeurId, mosqueeId },
              select: userSelect,
            })
          : [];
      const admins = await getAdminDestinataires(mosqueeId);
      return mergeDestinataires(profs, admins);
    }
    default:
      return [];
  }
}

export async function isDestinataireAutorise(
  userId: string,
  role: Role,
  mosqueeId: string,
  receiverId: string
): Promise<boolean> {
  const destinataires = await getDestinataires(userId, role, mosqueeId);
  if (destinataires.some((d) => d.id === receiverId)) {
    return true;
  }

  // Réponse à un correspondant avec qui un échange existe déjà
  return hasMessageExchange(userId, receiverId, mosqueeId);
}
