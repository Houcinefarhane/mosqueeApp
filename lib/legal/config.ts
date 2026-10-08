/** Informations légales affichées (à configurer via variables d'environnement en production). */

/** Version de la politique de confidentialité (incrémenter à chaque mise à jour substantielle). */
export const PRIVACY_POLICY_VERSION = "2026-04-08";

/** Texte unique pour joindre l'établissement (pas d'e-mail de contact applicatif). */
export const LEGAL_CONTACT_MOSQUE_NOTICE =
  "Pour toute question ou pour exercer vos droits, adressez-vous directement à l'administration de votre mosquée sur place.";

export function getLegalConfig() {
  const publisherName =
    process.env.LEGAL_PUBLISHER_NAME?.trim() || "MadrasApp";
  const publisherAddress =
    process.env.LEGAL_PUBLISHER_ADDRESS?.trim() ||
    "[Adresse de l'éditeur — à renseigner dans LEGAL_PUBLISHER_ADDRESS]";
  const hostingProvider =
    process.env.LEGAL_HOSTING_PROVIDER?.trim() || "Vercel Inc.";
  const hostingRegion =
    process.env.LEGAL_HOSTING_REGION?.trim() ||
    "Union européenne / États-Unis (sous-clauses contractuelles types)";
  const databaseProvider =
    process.env.LEGAL_DATABASE_PROVIDER?.trim() || "Neon (PostgreSQL)";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "") ||
    "https://votre-domaine.madrasapp.fr";

  return {
    appName: "MadrasApp",
    publisherName,
    publisherAddress,
    contactNotice: LEGAL_CONTACT_MOSQUE_NOTICE,
    hostingProvider,
    hostingRegion,
    databaseProvider,
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    lastUpdated: PRIVACY_POLICY_VERSION,
    urls: {
      privacyPolicy: `${appUrl}/legal/confidentialite`,
      mentionsLegales: `${appUrl}/legal/mentions-legales`,
      cookies: `${appUrl}/legal/cookies`,
      accountDeletion: `${appUrl}/legal/suppression-compte`,
      privacyChoices: `${appUrl}/legal/vos-choix`,
      dataSelfService: `${appUrl}/compte/donnees-personnelles`,
    },
  };
}

export type LegalConfig = ReturnType<typeof getLegalConfig>;
