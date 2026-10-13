export const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  PROFESSEUR: "/professeur",
  PARENT: "/parent",
  ELEVE: "/eleve",
};

export function homePathForRole(role: string | undefined | null): string {
  if (!role) return "/auth/login";
  return HOME_BY_ROLE[role] ?? "/auth/login";
}
