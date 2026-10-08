import Breadcrumb from "@/components/layout/Breadcrumb";

interface PageHeaderProps {
  title: string;
  description?: string;
  label?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  label,
  breadcrumbs,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-4 overflow-hidden rounded-3xl border border-filet bg-blanc p-4 sm:mb-6 sm:p-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3 hidden sm:block">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          {label && <p className="label-caps mb-1">{label}</p>}
          <h1 className="page-title">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-brun-doux sm:text-base">{description}</p>
          )}
        </div>
        {action && (
          <div className="w-full shrink-0 sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
