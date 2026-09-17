import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-gray-500 transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-primary" : "text-gray-500"}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
