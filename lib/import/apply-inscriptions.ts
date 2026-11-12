import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import {
  eleveLoginEmail,
  normalizePhoneFR,
  phoneToLoginEmail,
} from "../phone/fr";
import { resolveExcelIdentity } from "./inscription-match";

export type ConfirmedMatch = {
  eleveId: string;
  adult: boolean;
  label: string;
  source: "exact" | "mapping";
};

export type FamilyGroup = {
  familyKey: string;
  repNom: string;
  repPrenom: string;
  phone: string;
  doubtfulPhone: boolean;
  children: Array<{
    excelRow: number;
    repNom: string;
    repPrenom: string;
    enfantNom: string;
    enfantPrenom: string;
    dateNaissance: Date | null;
  }>;
};

export type ApplyImportStats = {
  parentsCreated: number;
  parentsReused: number;
  childrenLinked: number;
  childrenAlreadyLinked: number;
  adultAccountsCreated: number;
  adultAccountsReused: number;
  accountsIgnored: number;
  invalidPhones: number;
  crossFamilyBlocked: number;
  duplicateEleveBlocked: number;
};

type EleveRow = {
  id: string;
  parentId: string | null;
  userId: string | null;
  user: { id: string } | null;
};

export async function applyInscriptionsImport(options: {
  prisma: PrismaClient;
  mosqueeId: string;
  families: FamilyGroup[];
  confirmed: Map<number, ConfirmedMatch>;
  write: boolean;
  generatePassword: () => string;
}): Promise<{ stats: ApplyImportStats; credentialsLines: string[] }> {
  const stats: ApplyImportStats = {
    parentsCreated: 0,
    parentsReused: 0,
    childrenLinked: 0,
    childrenAlreadyLinked: 0,
    adultAccountsCreated: 0,
    adultAccountsReused: 0,
    accountsIgnored: 0,
    invalidPhones: 0,
    crossFamilyBlocked: 0,
    duplicateEleveBlocked: 0,
  };

  const rowToFamily = new Map<number, FamilyGroup>();
  for (const fam of options.families) {
    for (const c of fam.children) {
      rowToFamily.set(c.excelRow, fam);
    }
  }

  const usedEleveIds = new Set<string>();
  type Link = {
    excelRow: number;
    eleveId: string;
    adult: boolean;
    fam: FamilyGroup;
  };
  const links: Link[] = [];

  for (const [excelRow, match] of options.confirmed) {
    const fam = rowToFamily.get(excelRow);
    if (!fam) continue;

    if (usedEleveIds.has(match.eleveId)) {
      stats.duplicateEleveBlocked++;
      continue;
    }

    const phoneNorm = normalizePhoneFR(fam.phone);
    if (!match.adult && (!phoneNorm?.ok || fam.doubtfulPhone)) {
      stats.invalidPhones++;
      continue;
    }

    const eleve = await options.prisma.eleve.findUnique({
      where: { id: match.eleveId },
      include: { user: true },
    });
    if (!eleve || eleve.mosqueeId !== options.mosqueeId) continue;

    if (eleve.parentId) {
      const existingParent = await options.prisma.user.findUnique({
        where: { id: eleve.parentId },
        select: { id: true, telephoneNormalized: true, role: true },
      });
      if (
        existingParent?.role === "PARENT" &&
        existingParent.telephoneNormalized &&
        existingParent.telephoneNormalized !== fam.phone
      ) {
        stats.crossFamilyBlocked++;
        continue;
      }
    }

    usedEleveIds.add(match.eleveId);
    links.push({
      excelRow,
      eleveId: match.eleveId,
      adult: match.adult,
      fam,
    });
  }

  const processedRows = new Set(links.map((l) => l.excelRow));
  let totalChildRows = 0;
  for (const fam of options.families) {
    totalChildRows += fam.children.length;
  }
  stats.accountsIgnored = totalChildRows - processedRows.size;

  const linksByFamilyKey = new Map<string, Link[]>();
  for (const link of links) {
    const list = linksByFamilyKey.get(link.fam.familyKey) ?? [];
    list.push(link);
    linksByFamilyKey.set(link.fam.familyKey, list);
  }

  const credentialsLines: string[] = [];

  for (const [, familyLinks] of linksByFamilyKey) {
    const fam = familyLinks[0].fam;
    const phone = fam.phone;
    const minors = familyLinks.filter((l) => !l.adult);
    const adults = familyLinks.filter((l) => l.adult);

    let plainPassword: string | null = null;

    if (minors.length > 0) {
      const email = phoneToLoginEmail(phone);
      let parent = await options.prisma.user.findFirst({
        where: {
          mosqueeId: options.mosqueeId,
          role: "PARENT",
          OR: [{ telephoneNormalized: phone }, { email }],
        },
      });

      if (parent) {
        stats.parentsReused++;
      } else {
        stats.parentsCreated++;
        plainPassword = options.generatePassword();
        if (options.write) {
          const hash = await bcrypt.hash(plainPassword, 12);
          parent = await options.prisma.user.create({
            data: {
              email,
              password: hash,
              nom: fam.repNom || "Parent",
              prenom: fam.repPrenom || "Famille",
              telephone: phone,
              telephoneNormalized: phone,
              role: "PARENT",
              mosqueeId: options.mosqueeId,
              mustChangePassword: true,
              familyKey: fam.familyKey,
            },
          });
        }
      }

      for (const link of minors) {
        const eleve = await options.prisma.eleve.findUnique({
          where: { id: link.eleveId },
        });
        if (!eleve) continue;

        if (parent && eleve.parentId === parent.id) {
          stats.childrenAlreadyLinked++;
          continue;
        }

        stats.childrenLinked++;
        if (options.write && parent) {
          await options.prisma.eleve.update({
            where: { id: link.eleveId },
            data: { parentId: parent.id },
          });
        }
      }

      if (plainPassword && options.write) {
        credentialsLines.push(
          `${phone};PARENT;${fam.repNom};${fam.repPrenom};${plainPassword};${fam.familyKey};${minors.length}`
        );
      }
    }

    for (const link of adults) {
      const child = link.fam.children.find((c) => c.excelRow === link.excelRow);
      if (!child) continue;
      const id = resolveExcelIdentity(child);
      const eleve = await options.prisma.eleve.findUnique({
        where: { id: link.eleveId },
        include: { user: true },
      });
      if (!eleve) continue;

      if (eleve.userId && eleve.user) {
        stats.adultAccountsReused++;
        if (options.write) {
          await options.prisma.eleve.update({
            where: { id: eleve.id },
            data: { telephone: phone },
          });
        }
        continue;
      }

      const email = eleveLoginEmail(link.eleveId);
      const existingAdultUser = await options.prisma.user.findUnique({
        where: { email },
      });

      if (existingAdultUser) {
        stats.adultAccountsReused++;
        if (options.write) {
          await options.prisma.eleve.update({
            where: { id: eleve.id },
            data: { userId: existingAdultUser.id, telephone: phone },
          });
        }
        continue;
      }

      stats.adultAccountsCreated++;
      const adultPassword = options.generatePassword();

      if (options.write) {
        const hash = await bcrypt.hash(adultPassword, 12);
        const user = await options.prisma.user.create({
          data: {
            email,
            password: hash,
            nom: id.nom,
            prenom: id.prenom,
            telephone: phone,
            telephoneNormalized: null,
            role: "ELEVE",
            mosqueeId: options.mosqueeId,
            mustChangePassword: true,
            familyKey: fam.familyKey,
          },
        });
        await options.prisma.eleve.update({
          where: { id: eleve.id },
          data: { userId: user.id, telephone: phone },
        });
        credentialsLines.push(
          `${email};ELEVE (ADULTE);${id.nom};${id.prenom};${adultPassword};${fam.familyKey};${link.eleveId}`
        );
      }
    }
  }

  return { stats, credentialsLines };
}
