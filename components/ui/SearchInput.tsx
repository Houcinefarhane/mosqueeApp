"use client";

import { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="search"
        className={cn(
          "w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "transition-all duration-200",
          className
        )}
        {...props}
      />
    </div>
  );
}
