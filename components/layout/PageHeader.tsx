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
    <div className="mb-3 overflow-hidden rounded-lg border border-secondary/25 bg-gradient-to-r from-secondary/10 via-surface to-primary/5 p-3 shadow-card sm:mb-6 sm:rounded-xl sm:p-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-2 hidden sm:mb-3 sm:block">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="border-l-[3px] border-secondary pl-3 sm:border-l-4 sm:pl-4">
          <h1 className="text-base font-semibold tracking-tight text-primary-dark sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-xs text-primary/70 sm:mt-1 sm:text-sm">
              {description}
            </p>
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
