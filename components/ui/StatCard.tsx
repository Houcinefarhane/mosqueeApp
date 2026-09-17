import Link from "next/link";
import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type StatVariant = "green" | "gold" | "blue" | "purple";

const VARIANT_STYLES: Record<
  StatVariant,
  { iconColor: string; iconBg: string; border: string; accent: string; bg: string }
> = {
  green: {
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    border: "bg-primary",
    accent: "text-primary",
    bg: "from-surface-muted/90 to-surface",
  },
  gold: {
    iconColor: "text-secondary-dark",
    iconBg: "bg-secondary/15",
    border: "bg-secondary",
    accent: "text-secondary-dark",
    bg: "from-secondary/10 to-surface",
  },
  blue: {
    iconColor: "text-blue-700",
    iconBg: "bg-blue-100/80",
    border: "bg-blue-500",
    accent: "text-blue-600",
    bg: "from-blue-50/90 to-white",
  },
  purple: {
    iconColor: "text-violet-700",
    iconBg: "bg-violet-100/80",
    border: "bg-violet-500",
    accent: "text-violet-600",
    bg: "from-violet-50/90 to-white",
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: LucideIcon;
  variant?: StatVariant;
  iconColor?: string;
  iconBg?: string;
  borderColor?: string;
  href?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendDirection = "neutral",
  icon: Icon,
  variant = "green",
  iconColor,
  iconBg,
  borderColor,
  href,
}: StatCardProps) {
  const styles = VARIANT_STYLES[variant];
  const trendText = trend ?? subtitle;

  const TrendIcon =
    trendDirection === "up"
      ? TrendingUp
      : trendDirection === "down"
      ? TrendingDown
      : Minus;

  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-primary/8 bg-gradient-to-br p-4 shadow-card transition-all sm:p-5",
        styles.bg,
        href && "cursor-pointer hover:-translate-y-0.5 hover:shadow-elevated"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 h-[4px] rounded-t-xl",
          borderColor?.replace("border-", "bg-") ?? styles.border
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
          {trendText && (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1 text-xs font-medium",
                trendDirection === "up" && "text-emerald-600",
                trendDirection === "down" && "text-red-500",
                trendDirection === "neutral" && "text-gray-400"
              )}
            >
              <TrendIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{trendText}</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            "shrink-0 rounded-xl p-3 ring-1 ring-black/[0.04]",
            iconBg ?? styles.iconBg
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor ?? styles.iconColor)} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
