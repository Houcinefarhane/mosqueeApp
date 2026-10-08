import { prisma } from "@/lib/prisma";

export async function exportUserPersonalData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      telephone: true,
      role: true,
      mosqueeId: true,
      createdAt: true,
      updatedAt: true,
      privacyPolicyAcceptedAt: true,
      privacyPolicyVersion: true,
      parentalConsentAt: true,
      privacyConsentLogs: {
        select: {
          kind: true,
          policyVersion: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      deviceTokens: {
        select: {
          platform: true,
          createdAt: true,
          lastSeenAt: true,
        },
      },
      pushPreference: {
        select: {
          annoncesEnabled: true,
          messagesEnabled: true,
          absencesEnabled: true,
          pushPromptSeenAt: true,
        },
      },
      mosquee: {
        select: { nom: true, adresse: true, email: true, telephone: true },
      },
      eleve: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          classe: { select: { nom: true, niveau: true } },
        },
      },
      eleves: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          classe: { select: { nom: true, niveau: true } },
        },
      },
      classes: {
        select: { id: true, nom: true, niveau: true, salle: true },
      },
      messagesSent: {
        select: {
          id: true,
          objet: true,
          contenu: true,
          createdAt: true,
          receiverId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      },
      messagesReceived: {
        select: {
          id: true,
          objet: true,
          contenu: true,
          createdAt: true,
          senderId: true,
          lu: true,
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    exportedAt: new Date().toISOString(),
    format: "MadrasApp-RGPD-v1",
    compte: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      role: user.role,
      creeLe: user.createdAt,
      modifieLe: user.updatedAt,
      consentements: {
        politiqueAccepteeLe: user.privacyPolicyAcceptedAt,
        politiqueVersion: user.privacyPolicyVersion,
        accordParentalLe: user.parentalConsentAt,
        journal: user.privacyConsentLogs,
      },
      notifications: {
        appareilsEnregistres: user.deviceTokens,
        preferences: user.pushPreference,
      },
    },
    mosquee: user.mosquee,
    dossierEleve: user.eleve,
    enfants: user.eleves,
    classesEnseignees: user.classes,
    messagerie: {
      envoyes: user.messagesSent,
      recus: user.messagesReceived,
    },
    note:
      "Les notes, présences et autres données pédagogiques sont traitées par votre mosquée (responsable de traitement). Pour les exercer, rendez-vous à l'administration sur place.",
  };
}
