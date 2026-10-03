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
            <Button variant="outline" size="touch" className="sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Précédent
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="touch" className="sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm" disabled>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Précédent
          </Button>
        )}
        <span className="text-sm text-gray-600 px-2">
          Page {page} / {totalPages}
        </span>
        {nextHref ? (
          <Link href={nextHref}>
            <Button variant="outline" size="touch" className="sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm">
              Suivant
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="touch" className="sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm" disabled>
            Suivant
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
