import Link from "next/link";
import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type StatVariant = "green" | "gold" | "blue" | "purple";

const VARIANT_STYLES: Record<
  StatVariant,
  { iconColor: string; iconBg: string; border: string; accent: string; bg: string }
> = {
  green: {
    iconColor: "text-or",
    iconBg: "bg-or/15",
    border: "bg-or",
    accent: "text-brun",
    bg: "from-sable/50 to-blanc",
  },
  gold: {
    iconColor: "text-or",
    iconBg: "bg-or/15",
    border: "bg-or",
    accent: "text-brun-doux",
    bg: "from-or/10 to-blanc",
  },
  blue: {
    iconColor: "text-brun",
    iconBg: "bg-sable",
    border: "bg-brun",
    accent: "text-brun-doux",
    bg: "from-sable/80 to-blanc",
  },
  purple: {
    iconColor: "text-brun-doux",
    iconBg: "bg-sable",
    border: "bg-brun-doux",
    accent: "text-brun-doux",
    bg: "from-sable/60 to-blanc",
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
        "relative overflow-hidden rounded-3xl border border-filet bg-gradient-to-br transition-all",
        "p-3 sm:p-5",
        styles.bg,
        href && "cursor-pointer active:scale-[0.98] sm:hover:-translate-y-0.5"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 rounded-t-3xl",
          borderColor?.replace("border-", "bg-") ?? styles.border
        )}
      />

      <div className="flex flex-col items-center gap-0.5 text-center sm:hidden">
        <Icon
          className={cn("h-4 w-4", iconColor ?? styles.iconColor)}
          aria-hidden
        />
        <p className="font-display text-lg font-extrabold tabular-nums leading-none text-brun">
          {value}
        </p>
        <p className="label-caps line-clamp-2 !text-[10px] !tracking-[0.1em] text-brun-doux">
          {title}
        </p>
      </div>

      <div className="hidden items-start justify-between gap-3 sm:flex">
        <div className="min-w-0 flex-1">
          <p className="label-caps mb-1">{title}</p>
          <p className="font-display text-2xl font-extrabold tabular-nums tracking-tight text-brun lg:text-3xl">
            {value}
          </p>
          {trendText && (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1 text-xs font-medium text-brun-doux"
              )}
            >
              <TrendIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{trendText}</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            "shrink-0 rounded-2xl p-3",
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
