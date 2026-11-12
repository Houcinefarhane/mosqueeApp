/**
 * Comptes « École Démo » pour review Apple / stores.
 * Mots de passe stables (surcharge possible via .env).
 * Ne pas utiliser en dehors de l’environnement de démo.
 */

export const APPLE_DEMO_MOSQUEE_NOM = "École Démo";

export const APPLE_DEMO_LOGIN_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "https://madrasa-app-pi.vercel.app/auth/login";

export const APPLE_DEMO_ACCOUNTS = {
  admin: {
    email: "admin@review.ecole-demo.fr",
    password:
      process.env.APPLE_DEMO_ADMIN_PASSWORD?.trim() ||
      "ReviewAdmin-EcoleDemo2026!",
    role: "ADMIN" as const,
    label: "Admin",
  },
  prof: {
    email: "prof@review.ecole-demo.fr",
    password:
      process.env.APPLE_DEMO_PROF_PASSWORD?.trim() ||
      "ReviewProf-EcoleDemo2026!",
    role: "PROFESSEUR" as const,
    label: "Professeur",
  },
  eleve: {
    email: "eleve@review.ecole-demo.fr",
    password:
      process.env.APPLE_DEMO_ELEVE_PASSWORD?.trim() ||
      "ReviewEleve-EcoleDemo2026!",
    role: "ELEVE" as const,
    label: "Élève",
  },
} as const;

export function formatAppleDemoCredentialsBlock(): string {
  const lines = [
    "=== MadrasApp — École Démo (review Apple) ===",
    `École     : ${APPLE_DEMO_MOSQUEE_NOM}`,
    `Connexion : ${APPLE_DEMO_LOGIN_URL}`,
    "",
    `ADMIN     ${APPLE_DEMO_ACCOUNTS.admin.email}`,
    `          ${APPLE_DEMO_ACCOUNTS.admin.password}`,
    "",
    `PROF      ${APPLE_DEMO_ACCOUNTS.prof.email}`,
    `          ${APPLE_DEMO_ACCOUNTS.prof.password}`,
    "",
    `ÉLÈVE     ${APPLE_DEMO_ACCOUNTS.eleve.email}`,
    `          ${APPLE_DEMO_ACCOUNTS.eleve.password}`,
    "",
    "À saisir dans App Store Connect → App Review Information (pas en fiche publique).",
    "============================================",
  ];
  return lines.join("\n");
}
