import Link from "next/link";
import Button from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildPageHref } from "@/lib/admin/list-params";

type ListPaginationProps = {
  basePath: string;
  q: string;
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
};

export default function ListPagination({
  basePath,
  q,
  page,
  totalPages,
  from,
  to,
  total,
}: ListPaginationProps) {
  if (total === 0) return null;

  const prevHref = page > 1 ? buildPageHref(basePath, q, page - 1) : null;
  const nextHref = page < totalPages ? buildPageHref(basePath, q, page + 1) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
      <p className="text-sm text-gray-600">
        {from}–{to} sur {total} résultat{total > 1 ? "s" : ""}
        {q ? ` pour « ${q} »` : ""}
      </p>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link href={prevHref}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Précédent
          </Button>
        )}
        <span className="text-sm text-gray-600 px-2">
          Page {page} / {totalPages}
        </span>
        {nextHref ? (
          <Link href={nextHref}>
            <Button variant="outline" size="sm">
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Suivant
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
