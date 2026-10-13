export const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  PROFESSEUR: "/professeur",
  PARENT: "/parent",
  ELEVE: "/eleve",
};

/** Normalise le rôle JWT (ex. eleve → ELEVE) pour les redirections. */
export function normalizeAuthRole(
  role: string | undefined | null
): string | undefined {
  if (!role) return undefined;
  const upper = role.trim().toUpperCase();
  if (upper === "ELEVE" || upper === "ÉLÈVE") return "ELEVE";
  return upper;
}

export function homePathForRole(role: string | undefined | null): string {
  const key = normalizeAuthRole(role);
  if (!key) return "/auth/login";
  return HOME_BY_ROLE[key] ?? "/auth/login";
}
