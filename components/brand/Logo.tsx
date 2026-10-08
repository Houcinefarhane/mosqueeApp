import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  withWordmark?: boolean;
  /** Sur fond sombre : wordmark blanc + App or */
  onDark?: boolean;
  className?: string;
};

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="120" height="120" rx="30" fill="#C8962E" />
      <path
        d="M34 90V58c0-15 11-27 26-36 15 9 26 21 26 36v32"
        fill="none"
        stroke="#1E110A"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M47 90V65c0-7 5-13 13-18 8 5 13 11 13 18v25"
        fill="none"
        stroke="#1E110A"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({
  size = 40,
  withWordmark = true,
  onDark = false,
  className,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withWordmark && (
        <span
          className={cn(
            "font-display text-xl font-extrabold tracking-tight leading-none",
            onDark ? "text-blanc" : "text-brun"
          )}
        >
          Madrasa
          <span className="text-or">App</span>
        </span>
      )}
    </div>
  );
}
