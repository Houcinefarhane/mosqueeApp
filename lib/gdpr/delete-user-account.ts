import bcrypt from "bcryptjs";
import { prisma, withRetry } from "@/lib/prisma";

export class AccountDeletionError extends Error {
  code: "ADMIN_CONTACT" | "NOT_FOUND";

  constructor(code: "ADMIN_CONTACT" | "NOT_FOUND", message: string) {
    super(message);
    this.code = code;
  }
}

export async function deleteUserAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { eleve: { select: { id: true } } },
  });

  if (!user) {
    throw new AccountDeletionError("NOT_FOUND", "Utilisateur introuvable");
  }

  if (user.role === "ADMIN") {
    throw new AccountDeletionError(
      "ADMIN_CONTACT",
      "La suppression d'un compte administrateur de mosquée doit être demandée par e-mail afin de garantir la continuité des données de l'établissement."
    );
  }

  await withRetry(() =>
    prisma.$transaction(async (tx) => {
      if (user.role === "ELEVE" && user.eleve) {
        await tx.eleve.update({
          where: { id: user.eleve.id },
          data: { userId: null },
        });
        await tx.user.delete({ where: { id: userId } });
        return;
      }

      if (user.role === "PARENT") {
        await tx.eleve.updateMany({
          where: { parentId: userId },
          data: { parentId: null },
        });
        await tx.user.delete({ where: { id: userId } });
        return;
      }

      if (user.role === "PROFESSEUR") {
        await tx.classe.updateMany({
          where: { professeurId: userId },
          data: { professeurId: null },
        });
        const randomSecret = await bcrypt.hash(
          `${userId}-${Date.now()}-${Math.random()}`,
          10
        );
        await tx.user.update({
          where: { id: userId },
          data: {
            email: `supprime-${userId}@anonyme.madrasapp.local`,
            nom: "Compte",
            prenom: "Supprimé",
            telephone: null,
            password: randomSecret,
          },
        });
      }
    })
  );
}
