import type { Role } from "@prisma/client";

export const MESSAGING_ROLES: Role[] = [
  "ADMIN",
  "PROFESSEUR",
  "PARENT",
  "ELEVE",
];

export function canUseMessaging(role: string): role is Role {
  return MESSAGING_ROLES.includes(role as Role);
}
