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
      "inline-flex items-center justify-center font-semibold focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 rounded-2xl",
      TOUCH_FEEDBACK
    );

    const variants = {
      primary: "bg-or text-nuit hover:bg-or-clair",
      secondary: "bg-brun text-blanc hover:bg-nuit",
      outline: "border border-filet bg-blanc text-brun hover:bg-sable",
      ghost: "border border-filet bg-transparent text-brun-doux hover:bg-sable hover:text-brun",
      danger: "bg-brun-doux text-blanc hover:bg-brun",
    };

    const sizes = {
      sm: "gap-1.5 px-3 py-2 text-xs min-h-10 md:min-h-0",
      md: "gap-1.5 px-4 py-2.5 text-sm min-h-12 md:min-h-11",
      lg: "gap-2 px-5 py-3 text-sm min-h-12 md:text-base",
      touch: "gap-1.5 px-4 py-2.5 text-sm min-h-12",
    };

    const emphasisMobile =
      size === "sm" && TOUCH_EMPHASIS_VARIANTS.has(variant)
        ? "min-h-12 md:min-h-0"
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
