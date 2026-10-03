"use client";

import { cn } from "@/lib/utils";
import { TOUCH_EMPHASIS_VARIANTS, TOUCH_FEEDBACK } from "@/lib/ui/touch-styles";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "touch";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center font-medium focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
      TOUCH_FEEDBACK
    );

    const variants = {
      primary: "bg-primary text-white hover:bg-primary-dark",
      secondary:
        "bg-secondary text-primary-dark hover:bg-secondary-dark hover:text-white",
      outline:
        "border border-secondary/40 bg-surface text-foreground hover:border-primary hover:bg-surface-muted hover:text-primary",
      ghost: "text-primary/70 hover:bg-surface-muted hover:text-primary",
      danger: "bg-danger text-white hover:bg-red-700",
    };

    const sizes = {
      /** Secondaire desktop — 44px mobile min */
      sm: "gap-1.5 px-3 py-2.5 text-sm min-h-11 rounded-lg md:min-h-0 md:py-1.5",
      /** Défaut responsive : 48px mobile, compact md+ */
      md: "gap-2 px-4 py-3 text-base min-h-12 rounded-xl md:min-h-0 md:rounded-lg md:py-2 md:text-sm",
      lg: "gap-2 px-6 py-3 text-base min-h-12 rounded-xl md:rounded-lg md:py-2.5",
      /** Toujours 48px — barres d'action fixes mobile */
      touch: "gap-2 px-4 py-3 text-base min-h-12 rounded-xl",
    };

    const emphasisMobile =
      size === "sm" && TOUCH_EMPHASIS_VARIANTS.has(variant)
        ? "min-h-12 py-3 md:min-h-0 md:py-1.5"
        : null;

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          emphasisMobile,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Chargement...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
