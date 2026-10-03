"use client";

import { cn } from "@/lib/utils";
import { TOUCH_CONTROL } from "@/lib/ui/touch-styles";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, required, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          TOUCH_CONTROL,
          "min-h-[6rem] resize-y md:min-h-[5rem]",
          "disabled:cursor-not-allowed disabled:bg-gray-100",
          error && "border-danger focus:ring-danger/30",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
);

Textarea.displayName = "Textarea";

export default Textarea;
