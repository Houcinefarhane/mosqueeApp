import Link from "next/link";
import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type StatVariant = "green" | "gold" | "blue" | "purple";

const VARIANT_STYLES: Record<
  StatVariant,
  { iconColor: string; iconBg: string; border: string; accent: string }
> = {
  green: {
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    border: "bg-emerald-500",
    accent: "text-emerald-600",
  },
  gold: {
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    border: "bg-amber-500",
    accent: "text-amber-600",
  },
  blue: {
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    border: "bg-blue-500",
    accent: "text-blue-600",
  },
  purple: {
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    border: "bg-violet-500",
    accent: "text-violet-600",
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
        "relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow",
        href && "cursor-pointer hover:shadow-md"
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
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
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
