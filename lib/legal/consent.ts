import { z } from "zod";

export const PRIVACY_CONSENT_MESSAGE =
  "Vous devez accepter la politique de confidentialité pour continuer.";

export const privacyConsentSchema = z.literal(true, {
  errorMap: () => ({ message: PRIVACY_CONSENT_MESSAGE }),
});

export const PARENTAL_CONSENT_MESSAGE =
  "Les élèves de moins de 15 ans doivent obtenir l'accord de leur représentant légal (case à cocher avec un parent sur place ou lors de l'inscription en mosquée).";

export const parentalGuardianConsentSchema = z.literal(true, {
  errorMap: () => ({ message: PARENTAL_CONSENT_MESSAGE }),
});

export const COOKIE_CONSENT_KEY = "madras-cookie-consent";

export type CookieConsentChoice = "essential" | "analytics";
