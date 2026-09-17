import Badge from "@/components/ui/Badge";
import { DEVOIR_TYPES } from "@/lib/constants/devoirs";
import { formatDate } from "@/lib/utils";
import type { TypeDevoir } from "@prisma/client";
import { Calendar, User } from "lucide-react";

export interface DevoirItem {
  id: string;
  titre: string;
  contenu: string;
  matiere: string;
  type: TypeDevoir;
  dateLimite: string | Date | null;
  createdAt: string | Date;
  professeur?: { prenom: string; nom: string };
  classe: { nom: string };
}

interface DevoirCardProps {
  devoir: DevoirItem;
  action?: React.ReactNode;
}

export function DevoirCard({ devoir, action }: DevoirCardProps) {
  const typeInfo = DEVOIR_TYPES[devoir.type];
  const isLate =
    devoir.dateLimite && new Date(devoir.dateLimite) < new Date();

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
            <Badge className="border-gray-200 bg-gray-50 text-gray-700">
              {devoir.matiere}
            </Badge>
            {isLate && (
              <Badge className="border-red-200 bg-red-50 text-red-700">
                Échéance dépassée
              </Badge>
            )}
          </div>
          <h3 className="text-base font-semibold text-foreground">{devoir.titre}</h3>
          <p className="whitespace-pre-wrap text-sm text-gray-600">{devoir.contenu}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {devoir.professeur && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {devoir.professeur.prenom} {devoir.professeur.nom}
              </span>
            )}
            {devoir.classe?.nom && <span>{devoir.classe.nom}</span>}
            <span>Publié le {formatDate(devoir.createdAt)}</span>
            {devoir.dateLimite && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                À rendre avant le {formatDate(devoir.dateLimite)}
              </span>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
