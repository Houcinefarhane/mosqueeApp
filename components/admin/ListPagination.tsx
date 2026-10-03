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
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:px-6">
      <p className="text-center text-sm text-gray-600 sm:text-left">
        {from}–{to} sur {total} résultat{total > 1 ? "s" : ""}
        {q ? ` pour « ${q} »` : ""}
      </p>
      <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
        {prevHref ? (
          <Link href={prevHref} className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Précédent
            </Button>
          </Link>
        ) : (
          <Button variant="outline" className="flex-1 sm:flex-none" disabled>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Précédent
          </Button>
        )}
        <span className="shrink-0 px-1 text-sm tabular-nums text-gray-600">
          {page}/{totalPages}
        </span>
        {nextHref ? (
          <Link href={nextHref} className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto">
              Suivant
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" className="flex-1 sm:flex-none" disabled>
            Suivant
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
