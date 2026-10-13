/**
 * Normalisation téléphone France → 0XXXXXXXXX (10 chiffres).
 * Accepte espaces, points, +33 / 33, et Excel sans le 0 initial.
 */

export type PhoneNormalizeResult =
  | { ok: true; normalized: string; doubtful: boolean; reason?: string }
  | { ok: false; reason: string; doubtful: true };

const DOUBTFUL_SUFFIX = /[^0-9]x$/i;

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function normalizePhoneFR(raw: string | null | undefined): PhoneNormalizeResult {
  if (raw == null || String(raw).trim() === "") {
    return { ok: false, reason: "vide", doubtful: true };
  }

  const original = String(raw).trim();
  if (DOUBTFUL_SUFFIX.test(original.replace(/\s/g, ""))) {
    return { ok: false, reason: "suffixe douteux (x)", doubtful: true };
  }

  let d = digitsOnly(original);
  if (d.length === 0) {
    return { ok: false, reason: "aucun chiffre", doubtful: true };
  }

  if (d.startsWith("33") && d.length >= 11) {
    d = `0${d.slice(2)}`;
  }

  if (d.length === 9 && /^[67]/.test(d)) {
    d = `0${d}`;
  }

  if (d.length === 10 && d.startsWith("0")) {
    const doubtful =
      !/^0[1-9]\d{8}$/.test(d) ||
      original.toLowerCase().includes("x") ||
      /504[^0-9]?x/i.test(original);
    return {
      ok: true,
      normalized: d,
      doubtful,
      reason: doubtful ? "format ou suffixe suspect" : undefined,
    };
  }

  return {
    ok: false,
    reason: `longueur ${d.length} après nettoyage (${d.slice(0, 4)}…)`,
    doubtful: true,
  };
}

export function isPhoneLikeIdentifier(input: string): boolean {
  const t = input.trim();
  if (t.includes("@")) return false;
  const d = digitsOnly(t);
  return d.length >= 9 && d.length <= 13;
}

export function phoneToLoginEmail(normalizedPhone: string): string {
  return `tel.${normalizedPhone.replace(/\D/g, "")}@login.madrasapp.internal`;
}
