import { z } from "zod";

export const PRIVACY_CONSENT_MESSAGE =
  "Vous devez accepter la politique de confidentialité pour continuer.";

export const privacyConsentSchema = z.literal(true, {
  errorMap: () => ({ message: PRIVACY_CONSENT_MESSAGE }),
});

export const COOKIE_CONSENT_KEY = "madras-cookie-consent";

export type CookieConsentChoice = "essential" | "analytics";
