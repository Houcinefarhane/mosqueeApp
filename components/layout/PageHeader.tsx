import Breadcrumb from "@/components/layout/Breadcrumb";
import { BackLink } from "@/components/layout/HeaderActions";

interface PageHeaderProps {
  title: string;
  description?: string;
  label?: string;
  breadcrumbs?: { label: string; href?: string }[];
  back?: { href: string; label: string };
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  label,
  breadcrumbs,
  back,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-4 overflow-hidden rounded-3xl border border-filet bg-blanc p-4 sm:mb-6 sm:p-6">
      {back && (
        <div className="mb-3">
          <BackLink href={back.href}>{back.label}</BackLink>
        </div>
      )}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3 hidden sm:block">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          {label && <p className="label-caps mb-1">{label}</p>}
          <h1 className="page-title">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-brun-doux sm:text-base">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
