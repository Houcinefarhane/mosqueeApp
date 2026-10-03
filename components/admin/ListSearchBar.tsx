import Link from "next/link";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";

type ListSearchBarProps = {
  action: string;
  defaultValue?: string;
  placeholder?: string;
};

export default function ListSearchBar({
  action,
  defaultValue = "",
  placeholder = "Rechercher…",
}: ListSearchBarProps) {
  return (
    <form method="GET" action={action} className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="min-h-11 w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="outline" size="touch" className="flex-1 sm:flex-none sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm">
          Rechercher
        </Button>
        {defaultValue && (
          <Link href={action} className="flex-1 sm:flex-none">
            <Button type="button" variant="ghost" size="touch" className="w-full sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm">
              Effacer
            </Button>
          </Link>
        )}
      </div>
    </form>
  );
}
