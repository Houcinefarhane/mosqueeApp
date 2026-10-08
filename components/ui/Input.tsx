"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { TOUCH_CONTROL } from "@/lib/ui/touch-styles";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-semibold text-brun">
            {label}
            {required && <span className="ml-1 text-brun-doux">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            TOUCH_CONTROL,
            "disabled:cursor-not-allowed disabled:bg-sable",
            error && "border-brun-doux focus:ring-brun-doux/40",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-brun-doux">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-brun-doux">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
