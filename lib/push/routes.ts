import type { Role } from "@prisma/client";

export function messagesRouteForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin/messages";
    case "PROFESSEUR":
      return "/professeur/messages";
    case "PARENT":
      return "/parent/messages";
    case "ELEVE":
      return "/eleve/messages";
    default:
      return "/";
  }
}

export function annoncesRouteForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin/annonces";
    case "PROFESSEUR":
      return "/professeur";
    case "PARENT":
      return "/parent";
    case "ELEVE":
      return "/eleve";
    default:
      return "/";
  }
}

export function presencesRouteForRole(role: Role): string {
  switch (role) {
    case "PARENT":
      return "/parent/presences";
    case "ELEVE":
      return "/eleve/presences";
    default:
      return "/parent/presences";
  }
}
