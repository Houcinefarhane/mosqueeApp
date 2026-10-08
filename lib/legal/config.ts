/** Informations légales affichées (à configurer via variables d'environnement en production). */

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

  return {
    appName: "MadrasApp",
    publisherName,
    publisherAddress,
    contactNotice: LEGAL_CONTACT_MOSQUE_NOTICE,
    hostingProvider,
    hostingRegion,
    lastUpdated: "2026-04-08",
  };
}

export type LegalConfig = ReturnType<typeof getLegalConfig>;
