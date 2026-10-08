/** Informations légales affichées (à configurer via variables d'environnement en production). */
export function getLegalConfig() {
  const publisherName =
    process.env.LEGAL_PUBLISHER_NAME?.trim() || "MadrasApp";
  const contactEmail =
    process.env.LEGAL_CONTACT_EMAIL?.trim() || "contact@madrasapp.fr";
  const dpoEmail =
    process.env.LEGAL_DPO_EMAIL?.trim() || contactEmail;
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
    contactEmail,
    dpoEmail,
    publisherAddress,
    hostingProvider,
    hostingRegion,
    lastUpdated: "2026-04-08",
  };
}

export type LegalConfig = ReturnType<typeof getLegalConfig>;
