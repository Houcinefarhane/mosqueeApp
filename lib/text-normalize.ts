/** Comparaison insensible casse / accents pour noms et prénoms. */
export function normalizePersonName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function samePersonName(a: string, b: string): boolean {
  return normalizePersonName(a) === normalizePersonName(b);
}
