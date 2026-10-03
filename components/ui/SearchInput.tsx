"use client";

import { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOUCH_SEARCH } from "@/lib/ui/touch-styles";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export default function SearchInput({
  className,
  onSearch,
  ...props
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 md:left-3 md:h-5 md:w-5" />
      <input
        type="search"
        className={cn(TOUCH_SEARCH, className)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSearch) {
            onSearch((e.target as HTMLInputElement).value);
          }
        }}
        {...props}
      />
    </div>
  );
}
