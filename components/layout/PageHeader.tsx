import Breadcrumb from "@/components/layout/Breadcrumb";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-secondary/25 bg-gradient-to-r from-secondary/10 via-surface to-primary/5 p-4 shadow-card sm:mb-6 sm:p-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="border-l-4 border-secondary pl-4">
          <h1 className="text-xl font-semibold tracking-tight text-primary-dark sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-primary/70">{description}</p>
          )}
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">{action}</div>}
      </div>
    </div>
  );
}
