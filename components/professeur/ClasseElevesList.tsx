import { Mail, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClasseEleveItem = {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  parent: {
    prenom: string;
    nom: string;
  } | null;
};

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

type ClasseElevesListProps = {
  eleves: ClasseEleveItem[];
  className?: string;
};

export default function ClasseElevesList({
  eleves,
  className,
}: ClasseElevesListProps) {
  if (eleves.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-filet py-12 text-center text-sm text-brun-doux">
        Aucun élève dans cette classe pour le moment.
      </p>
    );
  }

  return (
    <ul
      className={cn(
        "overflow-hidden rounded-3xl border border-filet bg-blanc",
        className
      )}
    >
      {eleves.map((eleve, index) => (
        <li
          key={eleve.id}
          className={cn(
            "flex min-h-14 items-start gap-3 px-4 py-3 sm:items-center",
            index < eleves.length - 1 && "border-b border-filet"
          )}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brun font-display text-sm font-extrabold text-or-clair"
            aria-hidden
          >
            {initials(eleve.prenom, eleve.nom)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              {eleve.prenom} {eleve.nom}
            </p>
            {eleve.parent && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-brun-doux">
                <User className="h-3 w-3 shrink-0" aria-hidden />
                Parent : {eleve.parent.prenom} {eleve.parent.nom}
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-brun-doux">
              {eleve.email && (
                <span className="inline-flex max-w-full items-center gap-1 truncate">
                  <Mail className="h-3 w-3 shrink-0" aria-hidden />
                  {eleve.email}
                </span>
              )}
              {eleve.telephone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" aria-hidden />
                  {eleve.telephone}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
